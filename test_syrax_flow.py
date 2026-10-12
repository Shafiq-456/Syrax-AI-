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

        # Focus textarea
        await call('Runtime.evaluate', {'expression': '''
            (() => {
                const textarea = document.querySelector('textarea');
                textarea.focus();
                textarea.select();
            })()
        '''})

        # Insert text using Input.insertText
        text_to_insert = "An AI-powered real-time security vulnerability scanner that monitors code commits, detects zero-day exploits, and suggests verified automated patches."
        await call('Input.insertText', {'text': text_to_insert})

        await asyncio.sleep(0.5)

        # Check button status
        btn_status = await call('Runtime.evaluate', {'expression': '''
            (() => {
                const btn = document.getElementById('analyze-btn');
                return { disabled: btn.disabled, text: btn.innerText };
            })()
        ''', 'returnByValue': True})
        print("Button status after typing:", btn_status.get('result', {}).get('value'))

        # Click the button
        await call('Runtime.evaluate', {'expression': '''
            (() => {
                const btn = document.getElementById('analyze-btn');
                btn.click();
            })()
        '''})
        print("Clicked Analyze Idea button")

        # Capture pipeline running after 2 seconds
        await asyncio.sleep(2.0)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_pipeline_running.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_pipeline_running.png")

        # Poll until report appears (up to 40 seconds)
        for i in range(40):
            await asyncio.sleep(1.0)
            res_eval = await call('Runtime.evaluate', {'expression': '''
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasNoveltyScore: text.includes('Novelty') || text.includes('Score') || text.includes('OVERALL VERDICT'),
                        hasGaps: text.includes('Uncharted Opportunities') || text.includes('Gaps'),
                        hasArch: text.includes('Suggested Architecture') || text.includes('Roadmap'),
                        length: text.length,
                        preview: text.slice(0, 120).replace(/\\n/g, ' ')
                    };
                })()
            ''', 'returnByValue': True})
            data = res_eval.get('result', {}).get('value', {})
            print(f"Poll {i}: len={data.get('length')} score={data.get('hasNoveltyScore')} gaps={data.get('hasGaps')} arch={data.get('hasArch')}")
            if data.get('hasNoveltyScore') and (data.get('hasGaps') or data.get('hasArch')):
                print(">>> FULL REPORT HAS LOADED! <<<")
                break

        await asyncio.sleep(2.5)

        # Capture report sections
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 0);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_01_summary_score.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_01_summary_score.png")

        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 650);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_02_overlapping_sources.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_02_overlapping_sources.png")

        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1300);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_03_gaps_recommendations.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_03_gaps_recommendations.png")

        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 2000);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_04_architecture_roadmap.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_04_architecture_roadmap.png")

asyncio.run(run())
