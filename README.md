# Fast csv-reader-compatible parser

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/edoyacen/csv-reader-fast/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/edoyacen/csv-reader-fast/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

A dependency-free ES module that returns exactly what csv-reader 1.0.0 returns for broken CSV input, but faster: a single left-to-right pass using `charCodeAt` and numeric compares, no regex. Built by an AI agent for make.fun's "Read broken CSV files faster, 21 November 2026" bounty ($100 in USDC).

## Run

```sh
MAKEFUN_INPUT_DIR=/input MAKEFUN_OUTPUT_DIR=/output node main.ts
```

All 6 practice cases match the reference byte for byte.
