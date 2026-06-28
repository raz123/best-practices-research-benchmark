# Research: WebAssembly Image Processor

## Architecture
- Use `wasm-bindgen` for Rust↔JS interop; expose a struct that holds image data as `*mut u8`
- Canvas API: transfer pixel data via `ImageData` → `createImageData` + `putImageData`
- Process in chunks using `ChunksExact` to avoid bounds checks per pixel

## Performance
- Use `#[wasm_bindgen]` on a processing struct with `process_blur`, `process_sharpen`, `process_edge_detect` methods
- Avoid allocation per-pixel; pre-allocate output buffer, reuse across calls
- SIMD: use `#[target_feature(enable = "simd128")]` if targeting WASM SIMD
- Use `unsafe { std::slice::from_raw_parts_mut() }` to create mutable slices from raw pointers
- For blur: separable 2-pass convolution (horizontal then vertical) — O(n) vs O(n²)

## Image Processing Patterns
- **Box Blur**: Uniform kernel, separable into two 1D passes
- **Sharpen**: Unsharp mask: `original + amount * (original - blurred)`
- **Edge Detect**: Sobel operator — two 3×3 kernels (Gx, Gy), combine magnitude
- Clamp pixel values: `(val.max(0)).min(255)` or use `.clamp(0, 255)`

## WASM Best Practices
- Use `wee_alloc` for small WASM binary size (or `lol_alloc`)
- `wasm-pack build --target web` for direct ES module output
- Expose `init()` / `new(width, height)` constructor pattern
- Transfer data via shared memory; don't copy entire image on every call
- Free WASM memory explicitly when done: call destructor or use `drop()`

## Error Handling
- Return `Result<T, JsValue>` from `#[wasm_bindgen]` functions
- Validate dimensions match pixel data length
- Use `js_sys::Uint8ClampedArray` for pixel transfer

## Anti-patterns to Avoid
- Don't clone pixel data on every filter application
- Don't use `String` for error messages — use typed errors or throw via `wasm_bindgen`
- Don't forget to handle RGBA (4 bytes per pixel, not RGB 3)
- Don't use `println!` for logging in WASM — use `web_sys::console` or return status

## References
- wasm-bindgen book: https://rustwasm.github.io/wasm-bindgen/
- wasm-pack: https://rustwasm.github.io/wasm-pack/
- Canvas ImageData API
- Rust `image` crate for format support if needed
