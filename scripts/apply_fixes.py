content = open("jessica_core.py", "r", encoding="utf-8").read()
old = "def call_claude_api(prompt: str, system_prompt: str = \"\") -> str:"
new = "@retry_with_backoff(max_retries=3)\ndef call_claude_api(prompt: str, system_prompt: str = \"\") -> str:"
if old in content:
    content = content.replace(old, new)
    open("jessica_core.py", "w", encoding="utf-8").write(content)
    print("Patched Claude")
else:
    print("Not found Claude")
    idx = content.find("def call_claude_api")
    if idx != -1:
        print("Found similar:", repr(content[idx:idx+80]))

