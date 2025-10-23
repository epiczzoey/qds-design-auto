#!/bin/bash
# Vendor 스크립트 다운로드 스크립트
# React, ReactDOM, Babel Standalone을 로컬로 다운로드합니다.

set -e

VENDOR_DIR="public/vendor"

echo "📦 Vendor 디렉토리 생성 중..."
mkdir -p "$VENDOR_DIR"

echo "⬇️  React 다운로드 중..."
curl -L -o "$VENDOR_DIR/react.production.min.js" \
  "https://unpkg.com/react@18.2.0/umd/react.production.min.js"

echo "⬇️  ReactDOM 다운로드 중..."
curl -L -o "$VENDOR_DIR/react-dom.production.min.js" \
  "https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"

echo "⬇️  Babel Standalone 다운로드 중..."
curl -L -o "$VENDOR_DIR/babel-standalone.min.js" \
  "https://unpkg.com/@babel/standalone@7.23.5/babel.min.js"

echo "✅ Vendor 스크립트 다운로드 완료!"
echo ""
echo "다운로드된 파일:"
ls -lh "$VENDOR_DIR"

