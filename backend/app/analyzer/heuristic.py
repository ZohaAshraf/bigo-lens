import ast
from app.schemas import ComplexityResult


class LoopVisitor(ast.NodeVisitor):
    """Tracks the maximum nested loop depth in the code."""

    def __init__(self):
        self.max_depth = 0
        self.current_depth = 0
        self.loop_details = []

    def _enter_loop(self, node):
        self.current_depth += 1
        self.max_depth = max(self.max_depth, self.current_depth)
        self.loop_details.append(
            {"line": node.lineno, "depth": self.current_depth, "type": type(node).__name__}
        )
        self.generic_visit(node)
        self.current_depth -= 1

    def visit_For(self, node):
        self._enter_loop(node)

    def visit_While(self, node):
        self._enter_loop(node)


class RecursionVisitor(ast.NodeVisitor):
    """Finds recursive calls inside each function definition, tracking which
    if/elif/else branch each call sits in so mutually exclusive calls (e.g.
    binary search's if/elif/else) aren't confused with calls that truly run
    together in the same execution (e.g. fib(n-1) + fib(n-2))."""

    def __init__(self):
        self.function_calls = {}  # name -> list of (call_node, branch_path)
        self.current_func = None
        self.branch_path = []

    def visit_FunctionDef(self, node):
        prev_func, prev_path = self.current_func, self.branch_path
        self.current_func = node.name
        self.branch_path = []
        self.function_calls.setdefault(node.name, [])
        for stmt in node.body:
            self.visit(stmt)
        self.current_func, self.branch_path = prev_func, prev_path

    def visit_If(self, node):
        self.visit(node.test)
        self.branch_path.append((id(node), "body"))
        for stmt in node.body:
            self.visit(stmt)
        self.branch_path.pop()
        self.branch_path.append((id(node), "orelse"))
        for stmt in node.orelse:
            self.visit(stmt)
        self.branch_path.pop()

    def visit_Call(self, node):
        if self.current_func and isinstance(node.func, ast.Name):
            if node.func.id == self.current_func:
                self.function_calls[self.current_func].append((node, list(self.branch_path)))
        for child in ast.iter_child_nodes(node):
            self.visit(child)


def _mutually_exclusive(path_a, path_b) -> bool:
    """Two calls are mutually exclusive if they diverge on the same if-node
    (one took 'body', the other 'orelse') — meaning only one can ever run."""
    dict_a = dict(path_a)
    for if_id, branch in path_b:
        if dict_a.get(if_id) not in (None, branch):
            return True
    return False


def _has_halving_operation(func_node: ast.FunctionDef) -> bool:
    """Checks if the function body divides something by 2 (or bit-shifts by 1)
    anywhere — the classic 'mid = (low + high) // 2' or 'n >> 1' signal that
    input is being halved, even if it happens before the recursive call rather
    than inline in its arguments."""
    for n in ast.walk(func_node):
        if isinstance(n, ast.BinOp) and isinstance(n.op, (ast.FloorDiv, ast.Div)):
            if isinstance(n.right, ast.Constant) and n.right.value == 2:
                return True
        if isinstance(n, ast.BinOp) and isinstance(n.op, ast.RShift):
            if isinstance(n.right, ast.Constant) and n.right.value == 1:
                return True
    return False


def analyze_heuristic(code: str, language: str) -> ComplexityResult:
    if language != "python":
        return ComplexityResult(
            time_complexity="Unknown",
            space_complexity=None,
            confidence=0.0,
            explanation=f"Heuristic analysis for '{language}' isn't implemented yet — only Python is supported so far.",
            heuristic_signals={},
        )

    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return ComplexityResult(
            time_complexity="Unknown",
            space_complexity=None,
            confidence=0.0,
            explanation=f"Could not parse code: {e}",
            heuristic_signals={"syntax_error": str(e)},
        )

    loop_visitor = LoopVisitor()
    loop_visitor.visit(tree)
    loop_depth = loop_visitor.max_depth

    recursion_visitor = RecursionVisitor()
    recursion_visitor.visit(tree)
    recursive_functions = {
        name: calls for name, calls in recursion_visitor.function_calls.items() if calls
    }
    func_nodes = {n.name: n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)}

    uses_sort = any(
        isinstance(n, ast.Call)
        and (
            (isinstance(n.func, ast.Name) and n.func.id == "sorted")
            or (isinstance(n.func, ast.Attribute) and n.func.attr == "sort")
        )
        for n in ast.walk(tree)
    )

    signals = {
        "max_loop_nesting_depth": loop_depth,
        "recursive_functions": list(recursive_functions.keys()),
        "uses_builtin_sort": uses_sort,
        "loop_details": loop_visitor.loop_details,
    }

    time_complexity = "O(1)"
    confidence = 0.5
    explanation_parts = []

    if recursive_functions:
        for name, calls in recursive_functions.items():
            num_calls = len(calls)
            halves = name in func_nodes and _has_halving_operation(func_nodes[name])

            concurrent = False
            for i in range(num_calls):
                for j in range(i + 1, num_calls):
                    if not _mutually_exclusive(calls[i][1], calls[j][1]):
                        concurrent = True
                        break
                if concurrent:
                    break

            if concurrent and not halves:
                time_complexity = "O(2^n)"
                explanation_parts.append(
                    f"'{name}' makes {num_calls} recursive calls that can run together in the same invocation, "
                    "without shrinking the input by a fixed fraction — exponential branching, like naive Fibonacci."
                )
                confidence = 0.65
            elif concurrent and halves:
                time_complexity = "O(n log n)"
                explanation_parts.append(
                    f"'{name}' makes {num_calls} recursive calls that run together, each on a halved input — "
                    "a divide-and-conquer pattern, like merge sort."
                )
                confidence = 0.7
            elif not concurrent and halves:
                time_complexity = "O(log n)"
                explanation_parts.append(
                    f"'{name}' makes recursive calls that are mutually exclusive (only one branch runs) and "
                    "operate on a halved input — logarithmic recursion, like binary search."
                )
                confidence = 0.75
            else:
                time_complexity = "O(n)"
                explanation_parts.append(
                    f"'{name}' recurses without halving the input and its calls are mutually exclusive per "
                    "invocation — linear recursion."
                )
                confidence = 0.65

    elif loop_depth >= 1:
        time_complexity = "O(n)" if loop_depth == 1 else f"O(n^{loop_depth})"
        explanation_parts.append(
            f"Detected {loop_depth} level(s) of nested loops — each additional level typically multiplies "
            "the work by a factor of n."
        )
        confidence = 0.7

    elif uses_sort:
        time_complexity = "O(n log n)"
        explanation_parts.append(
            "No explicit loops or recursion found, but a built-in sort is used — Python's Timsort runs in O(n log n)."
        )
        confidence = 0.6

    else:
        explanation_parts.append(
            "No loops, recursion, or sorting detected — the code likely runs in constant time relative to input size."
        )
        confidence = 0.5

    return ComplexityResult(
        time_complexity=time_complexity,
        space_complexity=None,
        confidence=confidence,
        explanation=" ".join(explanation_parts),
        heuristic_signals=signals,
    )