#!/bin/bash
# YiShun PM2 Start Script
cd ~/yishun
pm2 start ecosystem.config.js
pm2 save
