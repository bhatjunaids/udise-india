"""Inject data.json + app.js into site/template.html -> index.html (repo root).

Output lives at the repo root because GitHub Pages serves the site from there;
site/ holds only the sources (template + app).
"""

data = open("data.json").read()
app = open("../site/app.js").read()
html = open("../site/template.html").read()

html = html.replace("/*__DATA__*/null", data)
html = html.replace("/*__APP__*/", app)
open("../index.html", "w").write(html)
print(f"wrote index.html  {len(html)//1024} KB")
