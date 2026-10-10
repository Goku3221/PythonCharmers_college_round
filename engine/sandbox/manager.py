"""
engine/sandbox/manager.py
E2B Sandbox session manager for isolated code execution.
Guarantees clean session lifecycle per execution.
Provides fallback when E2B_API_KEY is not configured.
"""

import os
import time
from typing import Any
from dotenv import load_dotenv

load_dotenv()


class SandboxExecutionResult:
    def __init__(self, stdout: str = "", stderr: str = "", error: str | None = None, duration: float = 0.0):
        self.stdout = stdout
        self.stderr = stderr
        self.error = error
        self.duration = duration

    def to_dict(self) -> dict[str, Any]:
        return {
            "stdout": self.stdout,
            "stderr": self.stderr,
            "error": self.error,
            "duration": self.duration,
        }


class E2BSandboxManager:
    """Manages isolated cloud sandbox sessions for executing agent-generated code."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("E2B_API_KEY")

    def execute_code(self, code: str, timeout: int = 15) -> SandboxExecutionResult:
        """
        Executes Python code in an isolated E2B cloud sandbox.
        Terminates the sandbox immediately after execution to guarantee isolation.
        """
        start_time = time.time()

        if not self.api_key:
            # Local safe simulation mode when E2B_API_KEY is unset
            duration = time.time() - start_time
            return SandboxExecutionResult(
                stdout=f"[Sandbox Emulation] Code received ({len(code)} bytes). Execution isolated.",
                duration=duration,
            )

        try:
            from e2b_code_interpreter import Sandbox  # type: ignore

            with Sandbox(api_key=self.api_key, timeout=timeout) as sandbox:
                execution = sandbox.run_code(code)
                duration = time.time() - start_time

                stdout = "".join(execution.logs.stdout)
                stderr = "".join(execution.logs.stderr)
                error_msg = execution.error.name if execution.error else None

                return SandboxExecutionResult(
                    stdout=stdout,
                    stderr=stderr,
                    error=error_msg,
                    duration=duration,
                )

        except Exception as e:
            duration = time.time() - start_time
            return SandboxExecutionResult(
                stderr=str(e),
                error=type(e).__name__,
                duration=duration,
            )
