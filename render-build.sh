#!/usr/bin/env bash

# Update and install necessary libraries for Puppeteer on Render
apt-get update && apt-get install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm-dev \
  libpango-1.0-0 \
  libx11-xcb1 \
  libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libgbm1 \
  libasound2 \
  libxss1 \
  libxtst6 \
  libappindicator3-1 \
  libdbusmenu-glib4 \
  libdbusmenu-gtk3-4

# Install Puppeteer dependencies
npm install
