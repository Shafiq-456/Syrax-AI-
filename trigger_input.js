(() => {
  const textarea = document.querySelector('textarea');
  if (!textarea) return 'No textarea';
  
  // React 16-19 value tracker workaround
  const valueTracker = textarea._valueTracker;
  if (valueTracker) {
    valueTracker.setValue('');
  }
  
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  nativeSetter.call(textarea, 'An AI-powered real-time security vulnerability scanner that monitors code commits, detects zero-day exploits, and suggests verified automated patches.');
  
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.dispatchEvent(new Event('change', { bubbles: true }));
  
  const btn = document.getElementById('analyze-btn');
  return {
    textareaVal: textarea.value,
    btnDisabled: btn ? btn.disabled : null,
    btnText: btn ? btn.innerText : null
  };
})()
