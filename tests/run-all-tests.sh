#!/bin/bash

# Test runner script for HTTP transport functionality
# Runs all test suites in sequence

echo "🧪 Running All HTTP Transport Tests"
echo "=================================="
echo ""

# Track overall results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo "🔍 Running: $test_name"
    echo "Command: $test_command"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo "✅ $test_name: PASSED"
        ((PASSED_TESTS++))
    else
        echo "❌ $test_name: FAILED"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
}

# Change to tests directory
cd "$(dirname "$0")"

# Ensure build is up to date
echo "🔨 Building project..."
cd ..
npm run build
cd tests
echo ""

# Run all test suites
run_test "HTTP Server Tests" "node test-http-server.js"
run_test "SMS HTTP Tests" "node test-sms-http.js" 
run_test "Twilio Integration Tests" "node test-twilio-integration.js"
run_test "Curl Examples" "./test-curl-examples.sh"

# Print final results
echo "📊 Final Test Results"
echo "===================="
echo "Total Tests: $TOTAL_TESTS"
echo "✅ Passed: $PASSED_TESTS"
echo "❌ Failed: $FAILED_TESTS"
echo "📈 Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed! HTTP transport is working correctly."
    exit 0
else
    echo "⚠️  Some tests failed. Please check the implementation."
    exit 1
fi