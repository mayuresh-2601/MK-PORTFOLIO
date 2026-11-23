import { useEffect, useState } from "react";

export default function TableOfContents({ headings = [] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id || "");

  useEffect(() => {
    const options = { rootMargin: "-20% 0px -80% 0px", threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    }, options);

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const handleClick = (event, heading) => {
    event.preventDefault();
    const element = document.getElementById(heading.id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="blog__toc" aria-label="Table of contents">
      <p className="blog__toc-heading">On this page</p>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id} className="blog__toc-item">
            <a
              href={`#${heading.id}`}
              className={`blog__toc-link${activeId === heading.id ? " is-active" : ""}`}
              aria-current={activeId === heading.id ? "location" : undefined}
              onClick={(event) => handleClick(event, heading)}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
