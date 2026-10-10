Here is a curated list of active GitHub repositories mapped directly to the modules needed to build the AgentBreak architecture:
1. Agent Sandboxing, Tracing & Harnesses

[UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) (and evaluations at [inspect_evals](https://github.com/UKGovernmentBEIS/inspect_evals))
Role in AgentBreak: Sandbox execution and multi-step trace inspector.
Key Features: Built by the UK AI Safety Institute. It provides native Docker/container isolation, tool-call orchestration, step-by-step reasoning logging, and a built-in terminal/web log viewer (inspect view) to analyze agent trajectory data.
[ryoungj/toolemu](https://github.com/ryoungj/toolemu)
 
Role in AgentBreak: Virtualized tool & environment emulator.
Key Features: Emulates arbitrary third-party tools, filesystems, and APIs via an adversarial LM to observe realistic tool failures and unsafe executions without executing live, dangerous code.

Multi-Step & Indirect Prompt Injection (Tool/Permission Auditing)

[ethz-spylab/agentdojo](https://github.com/ethz-spylab/agentdojo)
Role in AgentBreak: Benchmark for dynamic multi-step attacks and defenses on tool-calling agents.
Key Features: Developed by ETH Zurich's SPY Lab. Contains realistic suites (e.g., Slack, workspace, banking) testing how untrusted tool outputs hijack agent tool calls, along with built-in defenses (tool filtering, transformers-based detectors).
[uiuc-kang-lab/InjecAgent](https://github.com/uiuc-kang-lab/InjecAgent)
 
Role in AgentBreak: Indirect prompt injection test suite for tool permissions.
Key Features: Over 1,000 multi-stage scenarios testing direct harm attacks and data-stealing attacks (Stage 1 reading sensitive data, Stage 2 exfiltrating it via unauthorized tools).

Agent Memory & RAG Poisoning

[AI-secure/AgentPoison](https://github.com/AI-secure/AgentPoison)
 
Role in AgentBreak: Autonomous memory/knowledge-base poisoning.
Key Features: Implements the NeurIPS 2024 paper for red-teaming LLM agents by injecting optimized backdoor triggers into long-term memory/vector DBs, measuring attack success rates (ASR) versus benign utility retention.

Autonomous Red-Teaming & Adaptive Attack Generation

[microsoft/PyRIT](https://github.com/microsoft/PyRIT) (Python Risk Identification Tool for Generative AI)
Role in AgentBreak: Orchestrator for adaptive, multi-turn red-teaming strategies.
Key Features: Provides reusable attack loops (e.g., Crescendo attack, Tree of Attacks), scoring engines, and converters for iteratively probing targets until safety boundaries collapse.
[RICommunity/TAP](https://github.com/RICommunity/TAP)
Role in AgentBreak: Automated attack discovery without static wordlists.
Key Features: Implements the Tree of Attacks with Pruning algorithm, using an attacker LLM and tree search to autonomously generate and refine bypass payloads based on target feedback.
[NVIDIA/garak](https://github.com/NVIDIA/garak)
 
Role in AgentBreak: Automated probe runner and vulnerability reporting.
Key Features: Scans targets against established taxonomies (OWASP LLM Top 10, prompt injection, data exfiltration) and generates structured JSONL attack reports.

Defense Validation & Regression CI/CD

[promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)
 
Role in AgentBreak: Regression testing and policy validation.
Key Features: CLI and library for evaluating LLM app security in CI/CD pipelines. Supports automated red-team probes for privilege escalation (BFLA/BOLA), custom assertions on tool outputs, and side-by-side defense comparison dashboards.