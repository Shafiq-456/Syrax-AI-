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

        # 1. Fill React textarea and submit
        await call('Runtime.evaluate', {'expression': '''
            (() => {
                const textarea = document.querySelector('textarea');
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeSetter.call(textarea, "An AI-powered real-time security vulnerability scanner that monitors code commits, detects zero-day exploits, and suggests verified automated patches.");
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            })()
        '''})

        await asyncio.sleep(0.5)

        # Click analyze button
        await call('Runtime.evaluate', {'expression': '''
            (() => {
                const btn = document.getElementById('analyze-btn') || document.querySelector('button.btn-primary');
                if (btn) btn.click();
            })()
        '''})
        print("Clicked analyze button")

        # 2. Wait 2 seconds and capture live pipeline progress!
        await asyncio.sleep(2.0)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_pipeline_progress.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_pipeline_progress.png")

        # 3. Poll until full report appears
        for i in range(30):
            await asyncio.sleep(1.0)
            check = await call('Runtime.evaluate', {'expression': '''
                (() => {
                    const text = document.body.innerText;
                    return {
                        hasScore: text.includes('Novelty') || text.includes('OVERALL VERDICT') || text.includes('Score'),
                        hasGaps: text.includes('Uncharted Opportunities') || text.includes('Gaps') || text.includes('GAPS'),
                        preview: text.slice(0, 100).replace(/\\n/g, ' ')
                    };
                })()
            ''', 'returnByValue': True})
            val = check.get('result', {}).get('value', {})
            print(f"Poll {i}: {val}")
            if val.get('hasScore') and (val.get('hasGaps') or 'Report' in val.get('preview', '')):
                print("Report detected!")
                break

        await asyncio.sleep(2.0)

        # 4. Capture Full Report sections
        # Section A: Score & Executive Summary
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 0);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_score.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_score.png")

        # Section B: Overlapping Sources & Breakdown
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 600);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_overlaps.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_overlaps.png")

        # Section C: Gaps & Recommendations
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1200);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_gaps.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_gaps.png")

        # Section D: Suggested Architecture & Roadmap
        await call('Runtime.evaluate', {'expression': 'window.scrollTo(0, 1800);'})
        await asyncio.sleep(0.5)
        res = await call('Page.captureScreenshot', {'format': 'png'})
        with open(f'{OUT_DIR}/syrax_report_architecture.png', 'wb') as f:
            f.write(base64.b64decode(res['data']))
        print("Captured syrax_report_architecture.png")

asyncio.run(run())
