"""Build the static reading views from docs/*.md with markdown-it-py."""

from html import escape
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit

from markdown_it import MarkdownIt
from markdown_it.token import Token


DOCS = Path(__file__).resolve().parents[1] / "docs"
PARSER = MarkdownIt("commonmark", {"html": False}).enable("table")


def render_doc(source, sibling_docs):
    tokens = PARSER.parse(source.read_text(encoding="utf-8"))
    title = ""
    heading_id = ""
    used_ids = set()
    contents = []
    body = []

    for index, token in enumerate(tokens):
        if token.type == "heading_open":
            heading = tokens[index + 1].content
            slug = re.sub(r"[^a-z0-9]+", "-", heading.lower()).strip("-")
            heading_id = slug
            suffix = 1
            while heading_id in used_ids:
                suffix += 1
                heading_id = f"{slug}-{suffix}"
            used_ids.add(heading_id)
            token.attrSet("id", heading_id)
            if token.tag == "h1":
                title = heading
            elif token.tag == "h2":
                contents.append(f'<li><a href="#{heading_id}">{escape(heading)}</a></li>')

        for child in token.children or []:
            if child.type == "link_open":
                url = urlsplit(child.attrGet("href"))
                if not url.netloc and not url.scheme and url.path in sibling_docs:
                    html_path = str(Path(url.path).with_suffix(".html"))
                    child.attrSet("href", urlunsplit(("", "", html_path, url.query, url.fragment)))

        if token.type == "th_open":
            token.attrSet("scope", "col")
        if token.type == "table_open":
            table_wrap = Token("html_block", "", 0)
            table_wrap.content = (
                f'<div class="doc-table" role="region" aria-labelledby="{heading_id}" tabindex="0">\n'
            )
            token.attrSet("aria-labelledby", heading_id)
            body.append(table_wrap)
        body.append(token)
        if token.type == "table_close":
            close_wrap = Token("html_block", "", 0)
            close_wrap.content = "</div>\n"
            body.append(close_wrap)

    if not title:
        raise ValueError(f"Missing document title in {source.name}")

    rendered = PARSER.renderer.render(body, PARSER.options, {})
    return f"""<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)} | Transfer Pilot</title>
  <link rel="stylesheet" href="../styles.css">
  <link rel="stylesheet" href="docs.css">
</head>
<body>
  <a class="skip" href="#article">Skip to document</a>
  <header class="site-bar"><div class="doc-bar">
    <a class="wordmark" href="../index.html#home" aria-label="Transfer Pilot home"><span class="logo-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Transfer Pilot</a>
    <a class="doc-back" href="../index.html#evidence">Back to evidence</a>
  </div></header>
  <main class="doc-layout">
    <aside class="doc-toc"><nav aria-label="On this page">
      <h2>On this page</h2>
      <ul>{''.join(contents)}</ul>
    </nav></aside>
    <details class="doc-mobile-toc"><summary>On this page</summary>
      <nav aria-label="On this page"><ul>{''.join(contents)}</ul></nav>
    </details>
    <article id="article" class="doc-article" tabindex="-1">{rendered}</article>
  </main>
  <footer class="doc-footer"><a href="../index.html#evidence">Back to evidence</a></footer>
</body>
</html>
"""


def main():
    sources = sorted(DOCS.glob("*.md"))
    sibling_docs = {source.name for source in sources}
    for source in sources:
        source.with_suffix(".html").write_text(render_doc(source, sibling_docs), encoding="utf-8")


if __name__ == "__main__":
    main()
