# AI Provider Logs

This directory contains detailed logs from our AI provider testing and usage.

## Files
- `claude-test-*.log` - Detailed Claude Code test logs with verbose output
- `claude-test-*-error.log` - Error logs when Claude Code fails
- `AI_LOGS_README.md` - This file

## Log Structure
Each log file contains:
- `timestamp` - When the test was run
- `prompt` - The exact prompt sent to Claude Code
- `exitCode` - Process exit code (0 = success)
- `stdout` - Claude Code's response
- `stderr` - Verbose/debug output from Claude Code
- `allOutput` - Timestamped array of all output chunks
- `success` - Whether the test succeeded
- `outputLength` - Length of generated response
- `duration` - How long the request took (milliseconds)

## Usage
These logs help us:
1. Debug Claude Code integration issues
2. Understand response times and performance
3. Improve our AI prompts
4. Monitor AI provider reliability
5. Analyze output quality

## Azure Storage
Future enhancement: Upload logs to Azure Storage for team collaboration and long-term analysis.
