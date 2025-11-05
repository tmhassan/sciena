import os, json, openai
openai.api_key = os.getenv("OPENAI_API_KEY")

def call_llm(prompt, model="gpt-3.5-turbo", max_tokens=1200):
    try:
        resp = openai.ChatCompletion.create(
            model=model,
            messages=[{"role":"system","content":"Return ONLY valid JSON."},
                      {"role":"user","content":prompt}],
            temperature=0.3,
            max_tokens=max_tokens
        )
        return json.loads(resp.choices[0].message.content)
    except Exception as e:
        print("LLM error:", e)
        return None
