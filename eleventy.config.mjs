// eleventy.config.mjs
import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import pluginNavigation from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import fs from "node:fs";
import path from "node:path"; // (optional)

export default async function (eleventyConfig) {
  // Drafts
  eleventyConfig.addPreprocessor("drafts", "*", (data) => {
    if (data.draft) data.title = `${data.title} (draft)`;
    if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") return false;
  });

  // ──────────────────────────────────────────────────────────
  // Static passthroughs
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy({ "src/_": "_" });
  eleventyConfig.addPassthroughCopy("src/**/custom.css");
  eleventyConfig.addPassthroughCopy("src/**/custom.js");
  eleventyConfig.addPassthroughCopy(
    "src/**/*.{css,js,svg,webp,png,jpg,jpeg,gif,avif,ico,woff,woff2,ttf,otf,mp4,webm}"
  );

  // Auto-shim every post folder so assets end up at /<slug>/**
  const postsDir = "src/posts";
  if (fs.existsSync(postsDir)) {
    for (const entry of fs.readdirSync(postsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name; // e.g. "shiny", "polyposter"
      eleventyConfig.addPassthroughCopy({
        [`${postsDir}/${slug}/*.{css,js,svg,webp,png,jpg,jpeg,gif,avif}`]: `${slug}`,
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // Watch targets
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addWatchTarget("src/**/*.{css,js,svg,webp,png,jpg,jpeg,gif,avif}");

  // ──────────────────────────────────────────────────────────
  // Plugins
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
  eleventyConfig.addPlugin(IdAttributePlugin);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(sitemap, {
    lastModifiedProperty: "modified", // optional; otherwise falls back to `date`
    sitemap: {
      hostname: "https://weeideas.com", // MUST be your live origin
    },
  });

  // ──────────────────────────────────────────────────────────
  // Shortcodes
  // ──────────────────────────────────────────────────────────
  eleventyConfig.addShortcode("currentBuildDate", () => new Date().toISOString());
  eleventyConfig.addShortcode("currentYear", () => String(new Date().getFullYear()));

  // ──────────────────────────────────────────────────────────
  // Return config
  // ──────────────────────────────────────────────────────────
  return {
    templateFormats: ["md", "liquid", "html", "11ty.js", "njk"], // 👈 add "njk"
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
  };
}
