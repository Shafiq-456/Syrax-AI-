import asyncio
import json
import base64
import websockets
import time

TARGET_WS = 'ws://127.0.0.1:9222/devtools/page/2F505BCD972687AA4782989D88AD7DD2'
OUT_DIR = '/Users/shafiq/.gemini/antigravity-ide/brain/80ec51b9-b70a-40dd-a85a-11d6fd2f892b'

async def run():
    async with websockets.connect(TARGET_WS) as ws:
        msg_id = 1
        async def call(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {'id': msg_id, 'method': method, 'params': params or {}}
            await ws.send(json.dumps(payload))
            while True:
                resp = json.loads(await ws.recv())
                if resp.get('id') == msg_id:
                    return resp.get('result')

        # Click the button
        await call('Runtime.evaluate', {'expression': '''
            (() => {
                const btn = document.getElementById('analyze-btn');
                if (btn) btn.click();
            })()
        '''})
        print("Clicked analyze button!")

        # Wait 1.5s for page transition and pipeline progress to start
        await asyncio.sleep(1.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_02_pipeline_progress.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_02_pipeline_progress.png")

        # Poll until report loads (checking for Novelty Score & report content)
        for i in range(40):
            await asyncio.sleep(1.0)
            res_eval = await call('Runtime.evaluate', {'expression': '''
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasReport: text.includes('OVERALL VERDICT') || text.includes('Novelty Score') || text.includes('NOVELTY') || text.includes('Sources'),
                        hasGaps: text.includes('Uncharted Opportunities') || text.includes('GAPS') || text.includes('Gaps'),
                        hasArch: text.includes('Suggested Architecture') || text.includes('Roadmap'),
                        length: text.length,
                        preview: text.slice(0, 80).replace(/\\n/g, ' ')
                    };
                })()
            ''', 'returnByValue': True})
            val = res_eval.get('result', {}).get('value', {})
            print(f"Poll {i}: {val}")
            if val.get('hasReport') or (val.get('length', 0) > 600 and val.get('hasGaps')):
                print(">>> FULL REPORT HAS LOADED! <<<")
                break

        # Give it a moment to finish any entrance animations
        await asyncio.sleep(2.0)

        # Capture Section 1: Top of Report (Novelty Verdict, Score Gauge, Executive Summary)
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 0);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_03_report_score.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_03_report_score.png")

        # Capture Section 2: Overlapping Repositories & Academic Papers
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 600);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_04_report_sources.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_04_report_sources.png")

        # Capture Section 3: Innovation Gaps & Cited Recommendations
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1250);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_05_report_gaps.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_05_report_gaps.png")

        # Capture Section 4: Architecture Roadmap & Export Options
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1950);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_06_report_architecture.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_06_report_architecture.png")

asyncio.run(run())
