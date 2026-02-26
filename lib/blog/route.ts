// lib/blog/route.ts
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";

export type Locale = "en" | "fr";

export type BlogPost = {
  slug: string;
  publishedAt: string; // YYYY-MM-DD
  updatedAt?: string;  // YYYY-MM-DD
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  tags: string[];
  readingMinutes: number;
  faqs?: Array<{ q: Record<Locale, string>; a: Record<Locale, string> }>;
  sections: Array<{ heading: Record<Locale, string>; body: Record<Locale, string> }>;
  cta?: {
    heading: Record<Locale, string>;
    body: Record<Locale, string>;
    primaryLabel: Record<Locale, string>;
    primaryHref: string;
    secondaryLabel?: Record<Locale, string>;
    secondaryHref?: string;
  };
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".json"));

  const posts = files.map((f) => {
    const fp = path.join(BLOG_DIR, f);
    const raw = fs.readFileSync(fp, "utf8");
    const data = JSON.parse(raw) as Partial<BlogPost>;

    const slug = (data.slug ?? f.replace(/\.json$/, "")).trim();
    if (!slug) throw new Error(`Blog post file missing slug: ${fp}`);

    return {
      slug,
      publishedAt: String(data.publishedAt ?? "").trim(),
      updatedAt: data.updatedAt ? String(data.updatedAt).trim() : undefined,
      title: data.title as any,
      description: data.description as any,
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingMinutes: Number.isFinite(data.readingMinutes) ? (data.readingMinutes as number) : 6,
      sections: Array.isArray(data.sections) ? (data.sections as any) : [],
      faqs: Array.isArray(data.faqs) ? (data.faqs as any) : [],
      cta: data.cta as any
    };
  });

  return posts.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export const getAllBlogPosts = cache(() => readAllPosts());

export const getBlogPostBySlug = cache((slug: string) => {
  return getAllBlogPosts().find((p) => p.slug === slug);
});