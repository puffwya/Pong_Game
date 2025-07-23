# Makefile for C++ Pong (WASM build)

# Source and output
SRC       := pong.cpp
OUT_DIR   := docs
TARGET    := $(OUT_DIR)/pong.js

# Emscripten compile flags
EMCC_FLAGS := \
  -O2 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS="['_updateBall', '_movePaddle', '_getBallX', '_getBallY', '_getPaddleY', '_updateAI', '_updateGamePvE', '_getLastScore', '_resetGame', '_clearLastScore']" \
  -s EXPORTED_RUNTIME_METHODS="['cwrap', 'ccall']" \
  --no-entry

# Default target
all: $(TARGET)

# Build rule
$(TARGET): $(SRC)
	mkdir -p $(OUT_DIR)
	emcc $(SRC) -o $(TARGET) $(EMCC_FLAGS)

# Clean WASM and JS output
clean:
	rm -f $(OUT_DIR)/pong.js $(OUT_DIR)/pong.wasm

.PHONY: all clean

