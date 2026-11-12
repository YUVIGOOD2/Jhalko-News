/**
 * Article text ko SAFE tareeke se dikhata hai — koi HTML render nahi hota (XSS impossible).
 * Format:  khali line = naya paragraph,  "## " = sub-heading,  "> " = quote,  "- " = bullet
 */
export default function ArticleBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-news mt-6">
      {blocks.map((b, i) => {
        if (b.startsWith('## ')) return <h2 key={i}>{b.slice(3)}</h2>;
        if (b.startsWith('> ')) return <blockquote key={i}>{b.replace(/^>\s?/gm, '')}</blockquote>;
        if (/^- /m.test(b) && b.split('\n').every((l) => l.startsWith('- ')))
          return (
            <ul key={i}>
              {b.split('\n').map((l, j) => <li key={j}>{l.slice(2)}</li>)}
            </ul>
          );
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}
