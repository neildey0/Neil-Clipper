import json

log_path = "/Users/neildey/.gemini/antigravity/brain/fae5ef4a-68d4-4a28-a204-11c822035768/.system_generated/logs/transcript.jsonl"
file_content = ""

with open(log_path, 'r') as f:
    for line in f:
        try:
            step = json.loads(line)
            if "tool_calls" in step:
                for call in step["tool_calls"]:
                    name = call.get("function", {}).get("name")
                    argsStr = call.get("function", {}).get("arguments", "{}")
                    try:
                        args = json.loads(argsStr)
                        target = args.get("TargetFile", "")
                        if "page.tsx" in target:
                            if name == "default_api:write_to_file":
                                file_content = args.get("CodeContent", file_content)
                            elif name == "default_api:replace_file_content":
                                target_content = args.get("TargetContent", "")
                                replace_content = args.get("ReplacementContent", "")
                                file_content = file_content.replace(target_content, replace_content)
                            elif name == "default_api:multi_replace_file_content":
                                chunks = args.get("ReplacementChunks", [])
                                for chunk in chunks:
                                    tc = chunk.get("TargetContent", "")
                                    rc = chunk.get("ReplacementContent", "")
                                    file_content = file_content.replace(tc, rc)
                    except:
                        pass
        except:
            pass

print(f"Recovered length: {len(file_content)} chars")
with open("recovered_page.tsx", "w") as f:
    f.write(file_content)
