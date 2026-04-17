"""
Groq LLM Integration
Provides AI-powered explanations and insights using Groq's ultra-fast LLM API.
Falls back gracefully to rule-based explanations if API is unavailable.
"""
import os
from typing import Optional

# Try to load Groq
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

# Load .env
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
if os.path.exists(_env_path):
    with open(_env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())


class LLMProvider:
    """Groq-powered LLM for code explanations and analysis."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY", "")
        self.client = None
        self.model = "llama-3.1-8b-instant"  # Fast and capable
        self.available = False

        if HAS_GROQ and self.api_key:
            try:
                self.client = Groq(api_key=self.api_key)
                self.available = True
                print("🤖 Groq LLM connected successfully")
            except Exception as e:
                print(f"⚠️ Groq LLM init failed: {e}")

    def generate(self, prompt: str, system_prompt: str = "", max_tokens: int = 1024, temperature: float = 0.3) -> Optional[str]:
        """Generate a response from the LLM."""
        if not self.available:
            return None

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"⚠️ Groq LLM error: {e}")
            return None

    def explain_code(self, code: str, name: str, code_type: str, level: str,
                     dependencies: list = None, dependents: list = None,
                     docstring: str = "", complexity: int = 1) -> Optional[str]:
        """Generate an AI-powered code explanation."""
        system_prompt = """You are CodeCompass, an expert code analysis AI. You explain code clearly and accurately.
Your explanations are ALWAYS grounded in the actual code provided — never hallucinate or assume.
Use markdown formatting. Be concise but thorough."""

        level_instructions = {
            "beginner": "Explain as if to someone who just started programming. Use simple analogies. Avoid jargon. Focus on WHAT it does and WHY it exists.",
            "intermediate": "Explain for a developer who knows programming but is new to this codebase. Include technical details, patterns used, and how it fits into the system.",
            "expert": "Provide deep architectural analysis. Discuss complexity, coupling, potential issues, optimization opportunities, and design patterns. Be critical and insightful.",
        }

        deps_str = f"\n\nDependencies (imports from): {', '.join(dependencies)}" if dependencies else ""
        dependents_str = f"\nDepended on by: {', '.join(dependents)}" if dependents else ""
        doc_str = f"\nDocstring: {docstring}" if docstring else ""

        prompt = f"""Analyze this {code_type} named `{name}`:

```python
{code[:2000]}
```
{doc_str}{deps_str}{dependents_str}
Cyclomatic complexity: {complexity}

{level_instructions.get(level, level_instructions['intermediate'])}

Provide a structured explanation with:
1. **Purpose** — What does this {code_type} do?
2. **How it works** — Key logic and flow
3. **Dependencies & Role** — How it fits in the system
4. **Assessment** — Quality, risks, suggestions

Keep the response under 400 words. Use ## headings and bullet points."""

        return self.generate(prompt, system_prompt, max_tokens=800)

    def explain_impact(self, source_name: str, affected_nodes: list, direct_count: int, total_count: int) -> Optional[str]:
        """Generate AI analysis of impact simulation results."""
        system_prompt = "You are CodeCompass, analyzing the impact of code changes. Be concise and actionable."

        affected_list = "\n".join(f"- {n.get('label', n.get('id', '?'))} ({n.get('type', '?')}, depth: {n.get('depth', '?')})" for n in affected_nodes[:15])

        prompt = f"""A developer wants to modify `{source_name}`.

Impact analysis shows:
- {direct_count} directly affected components
- {total_count} total affected components

Affected components:
{affected_list}

Provide a brief risk assessment:
1. **Risk Level** and why
2. **Most critical dependencies** to watch
3. **Recommended approach** for making this change safely

Keep it under 150 words."""

        return self.generate(prompt, system_prompt, max_tokens=400)

    def smart_search_explain(self, query: str, results: list) -> Optional[str]:
        """Generate a natural language summary of search results."""
        if not results:
            return None

        system_prompt = "You are CodeCompass. Briefly explain search results to help a developer navigate a codebase."

        results_text = "\n".join(f"- {r.get('id', '?')} ({r.get('type', '?')}, score: {r.get('score', 0):.2f})" for r in results[:8])

        prompt = f"""Developer asked: "{query}"

Top results found:
{results_text}

Write a 2-3 sentence summary explaining where the answer lies in the codebase and which file/function to look at first."""

        return self.generate(prompt, system_prompt, max_tokens=200)


# Singleton instance
_llm_instance = None

def get_llm() -> LLMProvider:
    """Get the singleton LLM provider instance."""
    global _llm_instance
    if _llm_instance is None:
        _llm_instance = LLMProvider()
    return _llm_instance
