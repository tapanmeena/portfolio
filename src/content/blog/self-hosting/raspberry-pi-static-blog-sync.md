---
title: "Books, Barbells, and a Static Blog"
description: "How my workouts and late-night reading reach a static Astro blog from a Raspberry Pi, without manual updates or a live API."
publishedAt: 2026-11-27
category: Self-Hosting
tags:
  - Self-Hosting
  - Raspberry Pi
  - Astro
  - Node.js
  - SQLite
  - Automation
author: "Tapan Meena"
draft: false
---

I track workouts in OpenGym and reading in
[Tome](https://github.com/bndct-devops/tome). I wanted my website to reflect both
without becoming a third place to update.

Now it does. My Raspberry Pi publishes the updates, and the blog stays static.

## A little more life on the page

The [life page](/life) puts training and reading on the same 52-week heatmap.
Alongside it are workout summaries, books in progress, and a bookshelf built from
reading data.

It's a view of things I'm already recording, not another app asking me to log
them again. Finish a workout or log some reading, and a later sync carries it
over. There's no second entry to remember.

## A file between home and the internet

OpenGym and Tome run on the Pi. Cron runs two exporters: one reads OpenGym's JSON
state, the other reads Tome's SQLite database. They publish selected summaries to
a GitHub Gist, then call a Vercel deploy hook. Astro fetches those snapshots
during the build and turns them into the page.

The Gist gives Vercel somewhere to read without reaching into my home network.
It also keeps every reading session from becoming a Git commit.

The apps don't sync with each other. Both publish to the blog; nothing flows
back. That leaves book progress and workout records where they belong.

## Two small rules that mattered

### Yesterday ends at 4 a.m.

Reading at 12:45 a.m. doesn't feel like starting a new day. Splitting there would
make one late-night reading stretch look like two separate days on the heatmap.

Tome's exporter uses a 4 a.m. IST boundary instead. The calendar follows the
reading habit, rather than midnight deciding when the habit happened.

### Rest days don't need deployments

Cron can run without anything changing. Each exporter fingerprints selected
content and skips the upload and rebuild request when it matches the last export.

The fingerprint excludes the sync date and rolling reporting-window boundaries.
A new date isn't a new workout. Hashing the whole output would miss that
distinction.

## Publish the summary, not the database

The Pi constructs a smaller public snapshot before uploading. Workout dates and
working-set totals make the cut; body weight, photos, and exact timestamps don't.
Reading summaries leave out tokens, IP addresses, and precise EPUB positions.

Highlights and associated notes require a non-expired Tome share link covering
the book. That rule applies to annotations, not the shelf or reading summaries.
A secret Gist is still only unlisted, so everything sent there must be suitable
for public viewing. Removing a highlight later won't erase older copies.

## What I didn't build

There's no live dashboard polling the Pi. Once deployed, the page keeps working
even if the Pi goes offline. If fetching a snapshot fails during a later build,
the fetcher logs a warning and uses that source's committed fallback.

The trade-off is freshness. Updates wait for cron and a build. Quiet periods can
also leave rolling summaries dated; refreshing those without new activity needs
a forced export, not another build of the same snapshot.

For workouts and books, I can live with that delay. I'd rather spend the effort
on the page than maintain a live API for a handful of numbers.
