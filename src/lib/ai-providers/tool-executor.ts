// Tool Executor for Claude Code-style tools
import { ToolCall } from './types'
import { promises as fs } from 'fs'
import { spawn } from 'child_process'
import { promisify } from 'util'
import { glob } from 'glob'
import path from 'path'

const execAsync = promisify(spawn)

export async function executeToolCall(toolCall: ToolCall): Promise<any> {
  console.log(`🔧 Executing tool: ${toolCall.name}`, toolCall.parameters)
  
  try {
    switch (toolCall.name) {
      case 'Read':
        return await executePRead(toolCall.parameters)
      case 'Write':
        return await executeWrite(toolCall.parameters)
      case 'Edit':
        return await executeEdit(toolCall.parameters)
      case 'Bash':
        return await executeBash(toolCall.parameters)
      case 'Glob':
        return await executeGlob(toolCall.parameters)
      case 'Grep':
        return await executeGrep(toolCall.parameters)
      default:
        throw new Error(`Unknown tool: ${toolCall.name}`)
    }
  } catch (error) {
    console.error(`❌ Tool execution failed for ${toolCall.name}:`, error)
    throw error
  }
}

async function executePRead(params: { file_path: string; offset?: number; limit?: number }): Promise<string> {
  const { file_path, offset = 0, limit } = params
  
  try {
    const content = await fs.readFile(file_path, 'utf-8')
    const lines = content.split('\n')
    
    const startLine = Math.max(0, offset)
    const endLine = limit ? Math.min(lines.length, startLine + limit) : lines.length
    
    const selectedLines = lines.slice(startLine, endLine)
    
    // Return with line numbers like Claude Code
    return selectedLines
      .map((line, idx) => `${(startLine + idx + 1).toString().padStart(5, ' ')}→${line}`)
      .join('\n')
  } catch (error) {
    throw new Error(`Failed to read file ${file_path}: ${error}`)
  }
}

async function executeWrite(params: { file_path: string; content: string }): Promise<string> {
  const { file_path, content } = params
  
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(file_path), { recursive: true })
    await fs.writeFile(file_path, content, 'utf-8')
    return `File written successfully to ${file_path}`
  } catch (error) {
    throw new Error(`Failed to write file ${file_path}: ${error}`)
  }
}

async function executeEdit(params: { file_path: string; old_string: string; new_string: string; replace_all?: boolean }): Promise<string> {
  const { file_path, old_string, new_string, replace_all = false } = params
  
  try {
    const content = await fs.readFile(file_path, 'utf-8')
    
    let newContent: string
    if (replace_all) {
      newContent = content.split(old_string).join(new_string)
      const replacements = (content.match(new RegExp(escapeRegExp(old_string), 'g')) || []).length
      if (replacements === 0) {
        throw new Error(`String not found: ${old_string}`)
      }
    } else {
      if (!content.includes(old_string)) {
        throw new Error(`String not found: ${old_string}`)
      }
      newContent = content.replace(old_string, new_string)
    }
    
    await fs.writeFile(file_path, newContent, 'utf-8')
    return `File ${file_path} edited successfully`
  } catch (error) {
    throw new Error(`Failed to edit file ${file_path}: ${error}`)
  }
}

async function executeBash(params: { command: string; description?: string }): Promise<string> {
  const { command, description } = params
  
  if (description) {
    console.log(`📝 ${description}`)
  }
  
  return new Promise((resolve, reject) => {
    const childProcess = spawn('bash', ['-c', command], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env }
    })
    
    let stdout = ''
    let stderr = ''
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout || 'Command executed successfully')
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`))
      }
    })
    
    childProcess.on('error', (error) => {
      reject(new Error(`Failed to execute command: ${error.message}`))
    })
    
    // Set a timeout for long-running commands
    setTimeout(() => {
      childProcess.kill('SIGTERM')
      reject(new Error('Command timed out after 30 seconds'))
    }, 30000)
  })
}

async function executeGlob(params: { pattern: string; path?: string }): Promise<string[]> {
  const { pattern, path: searchPath } = params
  
  try {
    const fullPattern = searchPath ? `${searchPath}/${pattern}` : pattern
    const files = await new Promise<string[]>((resolve, reject) => {
      glob(fullPattern, (err, matches) => {
        if (err) reject(err)
        else resolve(matches)
      })
    })
    
    // Sort by modification time (most recent first) like Claude Code
    const filesWithStats = await Promise.all(
      files.map(async (file) => {
        try {
          const stats = await fs.stat(file)
          return { file, mtime: stats.mtime }
        } catch {
          return { file, mtime: new Date(0) }
        }
      })
    )
    
    return filesWithStats
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
      .map(item => item.file)
  } catch (error) {
    throw new Error(`Glob search failed: ${error}`)
  }
}

async function executeGrep(params: { 
  pattern: string; 
  path?: string; 
  glob?: string; 
  output_mode?: 'content' | 'files_with_matches' | 'count';
  '-n'?: boolean;
  '-C'?: number;
  '-A'?: number;
  '-B'?: number;
}): Promise<string> {
  const { 
    pattern, 
    path: searchPath = '.', 
    glob: globPattern,
    output_mode = 'files_with_matches',
    '-n': showLineNumbers = false,
    '-C': context,
    '-A': after,
    '-B': before
  } = params
  
  const args = ['rg', '--color=never']
  
  // Add output mode
  if (output_mode === 'files_with_matches') {
    args.push('-l')
  } else if (output_mode === 'count') {
    args.push('-c')
  }
  
  // Add line numbers
  if (showLineNumbers && output_mode === 'content') {
    args.push('-n')
  }
  
  // Add context
  if (context !== undefined && output_mode === 'content') {
    args.push(`-C${context}`)
  } else {
    if (after !== undefined && output_mode === 'content') {
      args.push(`-A${after}`)
    }
    if (before !== undefined && output_mode === 'content') {
      args.push(`-B${before}`)
    }
  }
  
  // Add glob pattern
  if (globPattern) {
    args.push('--glob', globPattern)
  }
  
  // Add pattern and path
  args.push(pattern, searchPath)
  
  return new Promise((resolve, reject) => {
    const process = spawn(args[0], args.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let stdout = ''
    let stderr = ''
    
    process.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    process.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    process.on('close', (code) => {
      // ripgrep returns 1 when no matches are found, which is not an error
      if (code === 0 || code === 1) {
        resolve(stdout || 'No matches found')
      } else {
        reject(new Error(`Grep failed with exit code ${code}: ${stderr}`))
      }
    })
    
    process.on('error', (error) => {
      reject(new Error(`Failed to execute grep: ${error.message}`))
    })
  })
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}