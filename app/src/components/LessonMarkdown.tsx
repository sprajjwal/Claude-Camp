import type { ComponentProps, ReactElement } from "react";
import { isValidElement } from "react";
import Markdown from "react-markdown";

type CodeProps = { className?: string; children?: string };

/**
 * Two special fences:
 * - ```spoiler renders as a collapsed block with a Copy button.
 * - ```prompt containing a number N renders the lesson's Nth prompt with a Copy button.
 */
function makePre(prompts: string[]) {
  return function Pre({ children }: ComponentProps<"pre">) {
  if (isValidElement(children)) {
    const { className, children: text } = (children as ReactElement<CodeProps>).props;
    if (className?.includes("language-prompt") && typeof text === "string") {
      const prompt = prompts[Number(text.trim()) - 1];
      if (prompt) {
        return (
          <div className="prompt-box">
            <code>{prompt}</code>
            <button className="btn text" onClick={() => navigator.clipboard.writeText(prompt)}>Copy</button>
          </div>
        );
      }
    }
    if (className?.includes("language-spoiler") && typeof text === "string") {
      const answer = text.replace(/\n$/, "");
      return (
        <details className="spoiler">
          <summary>Stuck? Show the answer</summary>
          <pre><code>{answer}</code></pre>
          <button className="btn text" onClick={() => navigator.clipboard.writeText(answer)}>Copy</button>
        </details>
      );
    }
  }
  return <pre>{children}</pre>;
  };
}

export function LessonMarkdown({ children, prompts = [] }: { children: string; prompts?: string[] }) {
  return <Markdown components={{ pre: makePre(prompts) }}>{children}</Markdown>;
}
