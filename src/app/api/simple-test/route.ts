import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

export async function GET() {
  try {
    console.log('🧪 Testing simple Claude Code integration...')
    
    // Test Claude Code availability
    const claudeVersion = await executeCommand('claude', ['--version'])
    console.log('Claude version:', claudeVersion)
    
    // Test simple Claude Code response
    const response = await executeCommand('claude', ['-p', 'What is 2+2? Just respond with the number.'])
    console.log('Claude response:', response)
    
    return NextResponse.json({
      success: true,
      claudeVersion: claudeVersion.trim(),
      response: response.trim(),
      message: 'Simple Claude Code test completed successfully'
    })
  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function executeCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let error = ''

    childProcess.stdout.on('data', (data) => {
      output += data.toString()
    })

    childProcess.stderr.on('data', (data) => {
      error += data.toString()
    })

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output)
      } else {
        reject(new Error(`Command failed with code ${code}: ${error}`))
      }
    })

    childProcess.on('error', (err) => {
      reject(new Error(`Failed to start command: ${err.message}`))
    })
  })
}