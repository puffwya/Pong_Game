#include <cstdlib>
#include <cstring>
#include <cmath>
#include <string>
extern "C" {

    int lastScore = -1;  // -1 = no score, 0 = left scored, 1 = right scored
    float ballX = 320, ballY = 240;
    float ballSpeedX = 3.0f;
    float ballSpeedY = 2.0f;
    const float ballSpeedIncrement = 0.5f;
    const float ballSpeedMax = 10.0f;
    #define BALL_SIZE 10

    float leftPaddleY = 200;
    float rightPaddleY = 200;
    #define PADDLE_WIDTH 10

    float paddleSpeed = 4;
    int canvasWidth = 640;
    int canvasHeight = 480;
    int paddleHeight = 80;

    const float AI_PADDLE_SPEED_EASY = 3.0f;
    const float AI_PADDLE_SPEED_MEDIUM = 6.0f;
    const float AI_PADDLE_SPEED_HARD = 9.0f;

    void updateBall() {
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Wall bounce
        if (ballY < 0 || ballY > canvasHeight) ballSpeedY = -ballSpeedY;

        // Paddle bounce (simplified)
        if (ballX < 30 && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;

            // Increase speed (cap max)
            if (fabs(ballSpeedX) < ballSpeedMax) {
                ballSpeedX += (ballSpeedX > 0) ? ballSpeedIncrement : -ballSpeedIncrement;
            }
            if (fabs(ballSpeedY) < ballSpeedMax) {
                ballSpeedY += (ballSpeedY > 0) ? ballSpeedIncrement : -ballSpeedIncrement;
            }
        }

        if (ballX > canvasWidth - 30 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX;

            if (fabs(ballSpeedX) < ballSpeedMax) {
                ballSpeedX += (ballSpeedX > 0) ? ballSpeedIncrement : -ballSpeedIncrement;
            }
            if (fabs(ballSpeedY) < ballSpeedMax) {
                ballSpeedY += (ballSpeedY > 0) ? ballSpeedIncrement : -ballSpeedIncrement;
            }
        }

        if (ballX < 0) {
            lastScore = 1;  // Right side scored
            ballX = canvasWidth / 2;
            ballY = canvasHeight / 2;

            ballSpeedX = (rand() % 2 == 0) ? 3.0f : -3.0f;
            ballSpeedY = (rand() % 2 == 0) ? 2.0f : -2.0f;

            // Reset paddles
            leftPaddleY = 200;
            rightPaddleY = 200;
        }
        else if (ballX > canvasWidth) {
            lastScore = 0;  // Left side scored
            ballX = canvasWidth / 2;
            ballY = canvasHeight / 2;

            ballSpeedX = (rand() % 2 == 0) ? 3.0f : -3.0f;
            ballSpeedY = (rand() % 2 == 0) ? 2.0f : -2.0f;

            // Reset paddles
            leftPaddleY = 200;
            rightPaddleY = 200;
        }
        else {
            lastScore = -1; // No score this update
        }
    }

    void movePaddle(int player, int direction) {
        float& paddle = (player == 0) ? leftPaddleY : rightPaddleY;
        paddle += direction * paddleSpeed;
        if (paddle < 0) paddle = 0;
        if (paddle > canvasHeight - paddleHeight) paddle = canvasHeight - paddleHeight;
    }

    float getBallX() { return ballX; }
    float getBallY() { return ballY; }
    float getPaddleY(int player) { return (player == 0) ? leftPaddleY : rightPaddleY; }

    void updateAI(float deltaTime, float ballX, float ballY, float ballSpeedX, float ballSpeedY, float& aiY, float errorChance, const std::string& difficulty) {
        float paddleCenter = aiY + paddleHeight / 2;
        float predictedY = ballY + BALL_SIZE / 2; // Default to current position

        float aiSpeed = AI_PADDLE_SPEED_MEDIUM;

        if (difficulty == "easy") {
            aiSpeed = AI_PADDLE_SPEED_EASY;
        } else if (difficulty == "hard") {
            aiSpeed = AI_PADDLE_SPEED_HARD;
        }


/*
        // Only predict on Medium or Hard difficulty
        if (difficulty == "Medium" || difficulty == "Hard") {
            // Time until ball reaches AI paddle (assuming AI paddle is on the right edge)
            float targetX = canvasWidth - PADDLE_WIDTH * 2;
            float timeToReachAI = (targetX - ballX) / ballSpeedX;

            // If ball is moving toward AI
            if (ballSpeedX > 0) {
                predictedY = ballY + ballSpeedY * timeToReachAI;

                // Reflect predictedY off top/bottom walls
                while (predictedY < 0 || predictedY > canvasHeight - BALL_SIZE) {
                    if (predictedY < 0)
                        predictedY = -predictedY;
                    else if (predictedY > canvasHeight - BALL_SIZE)
                        predictedY = 2 * (canvasHeight - BALL_SIZE) - predictedY;
                }
            }
        } else {
            // Easy just follows current Y with error
            predictedY = ballY + BALL_SIZE / 2;
        }
*/

        // Add random offset for error
        float offset = 0.0f;
        if (((float)rand() / RAND_MAX) < errorChance) {
            offset = (rand() % 50) - 25;
        }

        float targetY = predictedY + offset;

        if (rightPaddleY < 0) rightPaddleY = 0;
        if (rightPaddleY + paddleHeight > canvasHeight) rightPaddleY = canvasHeight - paddleHeight;

        if (paddleCenter < targetY - 5)
            rightPaddleY += aiSpeed; // move down
        else if (paddleCenter > targetY + 5)
            rightPaddleY -= aiSpeed; // move up
    }

    int getLastScore() {
        return lastScore;
    }

    void clearLastScore() {
        lastScore = -1;
    }

    void updateGamePvE(const char* difficulty, int upPressed, int downPressed) {
        float deltaTime = 1.0f / 60.0f;
        updateBall();

        // Player 1 movement
        if (upPressed)
            movePaddle(0, -1);
        if (downPressed)
            movePaddle(0, 1);

        // AI movement and difficulty logic
        float errorChance = 0.0f;
        if (strcmp(difficulty, "easy") == 0) {
            errorChance = 0.25f;
        } else if (strcmp(difficulty, "medium") == 0) {
            errorChance = 0.1f;
        } else if (strcmp(difficulty, "hard") == 0) {
            errorChance = 0.02f;
        }

        updateAI(deltaTime, ballX, ballY, ballSpeedX, ballSpeedY, rightPaddleY, errorChance, difficulty);
    }

    void resetGame() {
        // Reset ball position and speed
        ballX = 320;
        ballY = 240;
        ballSpeedX = 3.0f;
        ballSpeedY = 2.0f;

        // Reset paddles
        leftPaddleY = 200;
        rightPaddleY = 200;

        // Reset score tracker
        lastScore = -1;
    }
}
