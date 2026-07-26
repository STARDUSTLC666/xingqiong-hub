/* ===========================================================================
   星穹枢庭 · 子页面兼容层
   ---------------------------------------------------------------------------
   历史上这个文件负责星空画布和 gsToast / gsCopy 两个全局函数。
   现在环境背景、提示条和复制都由 assets/sanctuary.js 统一提供，
   本文件只保留一份兜底实现，供 sanctuary.js 尚未就绪时调用。
   =========================================================================== */

(function () {
  "use strict";

  /** sanctuary.js 装载后会覆盖这两个全局函数；这里只做最小可用的兜底。 */
  function fallbackToast(message) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = String(message == null ? "" : message);
    document.body.appendChild(node);
    setTimeout(() => node.remove(), 2500);
  }

  async function fallbackCopy(text) {
    const value = String(text == null ? "" : text);

    try {
      await navigator.clipboard.writeText(value);
      window.gsToast("已复制到剪贴板");
      return true;
    } catch {
      const scratch = document.createElement("textarea");
      scratch.value = value;
      scratch.setAttribute("readonly", "");
      scratch.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
      document.body.appendChild(scratch);
      scratch.select();

      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }

      scratch.remove();
      window.gsToast(ok ? "已复制到剪贴板" : "复制失败，请手动选择文本");
      return ok;
    }
  }

  if (typeof window.gsToast !== "function") window.gsToast = fallbackToast;
  if (typeof window.gsCopy !== "function") window.gsCopy = fallbackCopy;
})();
