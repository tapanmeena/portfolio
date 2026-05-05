// Transforms ```mermaid code fences into raw HTML <pre class="mermaid">…</pre>
// blocks so they bypass syntax highlighting and can be picked up by the
// client-side mermaid renderer in BaseLayout.

import { visit } from "unist-util-visit";

export default function remarkMermaid() {
  return (tree) => {
    visit(tree, "code", (node, index, parent) => {
      if (!parent || node.lang !== "mermaid") return;
      const escaped = String(node.value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      parent.children[index] = {
        type: "html",
        value: `<pre class="mermaid">${escaped}</pre>`,
      };
    });
  };
}
