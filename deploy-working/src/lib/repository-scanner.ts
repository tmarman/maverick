import { promises as fs } from 'fs'
import path from 'path'

export interface FileInfo {
  relativePath: string
  absolutePath: string
  size: number
  lastModified: Date
  extension: string
  type: 'component' | 'api' | 'config' | 'test' | 'docs' | 'other'
  framework?: string
  language: string
}

export interface CodebaseAnalysis {
  projectRoot: string
  totalFiles: number
  totalSize: number
  languages: Record<string, number>
  frameworks: string[]
  fileTypes: Record<string, number>
  directoryStructure: DirectoryNode
  files: FileInfo[]
  dependencies: DependencyInfo
  configurations: ConfigInfo[]
  testCoverage: TestCoverageInfo
}

export interface DirectoryNode {
  name: string
  path: string
  type: 'directory' | 'file'
  children?: DirectoryNode[]
  size?: number
  fileCount?: number
}

export interface DependencyInfo {
  packageJson?: PackageJsonInfo
  requirements?: string[]
  gemfile?: string[]
  external: string[]
  internal: string[]
}

export interface PackageJsonInfo {
  name?: string
  version?: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  main?: string
  type?: string
}

export interface ConfigInfo {
  type: string
  file: string
  config: any
}

export interface TestCoverageInfo {
  hasTests: boolean
  testFiles: string[]
  testFrameworks: string[]
  coverageEstimate: number
}

export class RepositoryScanner {
  private projectRoot: string
  private ignoredPatterns: string[]

  constructor(projectRoot: string, ignoredPatterns: string[] = []) {
    this.projectRoot = projectRoot
    this.ignoredPatterns = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.log',
      '.env*',
      '.DS_Store',
      ...ignoredPatterns
    ]
  }

  async scanRepository(): Promise<CodebaseAnalysis> {
    console.log(`Starting repository scan of: ${this.projectRoot}`)
    
    const files = await this.getAllFiles()
    const directoryStructure = await this.buildDirectoryStructure()
    const dependencies = await this.analyzeDependencies()
    const configurations = await this.findConfigurations()
    const testCoverage = await this.analyzeTestCoverage(files)

    const analysis: CodebaseAnalysis = {
      projectRoot: this.projectRoot,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
      languages: this.analyzeLanguages(files),
      frameworks: await this.detectFrameworks(),
      fileTypes: this.categorizeFileTypes(files),
      directoryStructure,
      files,
      dependencies,
      configurations,
      testCoverage
    }

    console.log(`Scan complete: ${files.length} files, ${analysis.frameworks.length} frameworks detected`)
    return analysis
  }

  private async getAllFiles(): Promise<FileInfo[]> {
    const filePaths = await this.scanDirectory(this.projectRoot)
    const files: FileInfo[] = []
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath)
        const relativePath = path.relative(this.projectRoot, filePath)
        const extension = path.extname(filePath).toLowerCase()
        
        const fileInfo: FileInfo = {
          relativePath,
          absolutePath: filePath,
          size: stats.size,
          lastModified: stats.mtime,
          extension,
          type: this.classifyFileType(relativePath, extension),
          language: this.detectLanguage(extension),
          framework: await this.detectFileFramework(filePath)
        }
        
        files.push(fileInfo)
      } catch (error) {
        console.warn(`Could not stat file ${filePath}:`, error)
      }
    }

    return files
  }

  private classifyFileType(relativePath: string, extension: string): FileInfo['type'] {
    const path = relativePath.toLowerCase()
    
    // Test files
    if (path.includes('test') || path.includes('spec') || path.includes('__tests__')) {
      return 'test'
    }
    
    // API routes
    if (path.includes('api') || path.includes('route')) {
      return 'api'
    }
    
    // React components
    if ((extension === '.tsx' || extension === '.jsx') && !path.includes('api')) {
      return 'component'
    }
    
    // Configuration files
    if (extension === '.json' || extension === '.yaml' || extension === '.yml' || 
        extension === '.toml' || extension === '.ini' || extension === '.config') {
      return 'config'
    }
    
    // Documentation
    if (extension === '.md' || extension === '.rst' || extension === '.txt') {
      return 'docs'
    }
    
    return 'other'
  }

  private detectLanguage(extension: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.dart': 'Dart',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.html': 'HTML',
      '.xml': 'XML',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.ps1': 'PowerShell'
    }
    
    return languageMap[extension] || 'Unknown'
  }

  private async detectFileFramework(filePath: string): Promise<string | undefined> {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      
      // React detection
      if (content.includes('import React') || content.includes('from \'react\'') || 
          content.includes('from "react"') || content.includes('useState') || 
          content.includes('useEffect')) {
        return 'React'
      }
      
      // Next.js detection
      if (content.includes('next/') || content.includes('NextRequest') || 
          content.includes('NextResponse')) {
        return 'Next.js'
      }
      
      // Express detection
      if (content.includes('express') && content.includes('.get(') || 
          content.includes('.post(')) {
        return 'Express'
      }
      
      // Prisma detection
      if (content.includes('@prisma/client') || content.includes('PrismaClient')) {
        return 'Prisma'
      }
      
    } catch (error) {
      // File not readable or too large
    }
    
    return undefined
  }

  private analyzeLanguages(files: FileInfo[]): Record<string, number> {
    const languages: Record<string, number> = {}
    
    for (const file of files) {
      languages[file.language] = (languages[file.language] || 0) + 1
    }
    
    return languages
  }

  private categorizeFileTypes(files: FileInfo[]): Record<string, number> {
    const types: Record<string, number> = {}
    
    for (const file of files) {
      types[file.type] = (types[file.type] || 0) + 1
    }
    
    return types
  }

  private async buildDirectoryStructure(): Promise<DirectoryNode> {
    const root: DirectoryNode = {
      name: path.basename(this.projectRoot),
      path: this.projectRoot,
      type: 'directory',
      children: [],
      fileCount: 0,
      size: 0
    }

    await this.buildDirectoryNode(this.projectRoot, root)
    return root
  }

  private async buildDirectoryNode(dirPath: string, node: DirectoryNode): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.relative(this.projectRoot, fullPath)
        
        // Skip ignored patterns
        if (this.isIgnored(relativePath)) continue
        
        if (entry.isDirectory()) {
          const childNode: DirectoryNode = {
            name: entry.name,
            path: fullPath,
            type: 'directory',
            children: [],
            fileCount: 0,
            size: 0
          }
          
          await this.buildDirectoryNode(fullPath, childNode)
          node.children!.push(childNode)
          node.fileCount! += childNode.fileCount!
          node.size! += childNode.size!
        } else {
          const stats = await fs.stat(fullPath)
          const fileNode: DirectoryNode = {
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: stats.size
          }
          
          node.children!.push(fileNode)
          node.fileCount! += 1
          node.size! += stats.size
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${dirPath}:`, error)
    }
  }

  private isIgnored(relativePath: string): boolean {
    return this.ignoredPatterns.some(pattern => {
      const normalizedPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      const regex = new RegExp(`^${normalizedPattern}$`)
      return regex.test(relativePath)
    })
  }

  private async analyzeDependencies(): Promise<DependencyInfo> {
    const dependencies: DependencyInfo = {
      external: [],
      internal: []
    }

    // Analyze package.json
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)
      
      dependencies.packageJson = {
        name: packageJson.name,
        version: packageJson.version,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {},
        main: packageJson.main,
        type: packageJson.type
      }
      
      dependencies.external = [
        ...Object.keys(packageJson.dependencies || {}),
        ...Object.keys(packageJson.devDependencies || {})
      ]
    } catch (error) {
      console.warn('Could not read package.json:', error)
    }

    // Analyze internal dependencies (imports/requires)
    // This would require more sophisticated AST parsing
    // For now, we'll implement a basic version

    return dependencies
  }

  private async findConfigurations(): Promise<ConfigInfo[]> {
    const configs: ConfigInfo[] = []
    const configFiles = [
      'package.json',
      'tsconfig.json',
      'next.config.js',
      'next.config.mjs',
      'tailwind.config.js',
      'tailwind.config.ts',
      'eslint.config.js',
      '.eslintrc.js',
      '.eslintrc.json',
      'jest.config.js',
      'jest.config.ts',
      'prisma/schema.prisma',
      'Dockerfile',
      'docker-compose.yml',
      '.env.example'
    ]

    for (const configFile of configFiles) {
      try {
        const configPath = path.join(this.projectRoot, configFile)
        const content = await fs.readFile(configPath, 'utf-8')
        
        let config: any
        if (configFile.endsWith('.json')) {
          config = JSON.parse(content)
        } else if (configFile.endsWith('.yml') || configFile.endsWith('.yaml')) {
          // For YAML files, we'd need a YAML parser
          config = { raw: content }
        } else {
          config = { raw: content }
        }
        
        configs.push({
          type: this.getConfigType(configFile),
          file: configFile,
          config
        })
      } catch (error) {
        // Config file doesn't exist or can't be read
      }
    }

    return configs
  }

  private getConfigType(filename: string): string {
    if (filename.includes('package.json')) return 'package'
    if (filename.includes('tsconfig')) return 'typescript'
    if (filename.includes('next.config')) return 'nextjs'
    if (filename.includes('tailwind')) return 'tailwind'
    if (filename.includes('eslint')) return 'eslint'
    if (filename.includes('jest')) return 'jest'
    if (filename.includes('prisma')) return 'prisma'
    if (filename.includes('docker')) return 'docker'
    if (filename.includes('.env')) return 'environment'
    return 'other'
  }

  private async analyzeTestCoverage(files: FileInfo[]): Promise<TestCoverageInfo> {
    const testFiles = files.filter(file => file.type === 'test')
    const sourceFiles = files.filter(file => 
      file.type === 'component' || file.type === 'api' || file.type === 'other'
    ).filter(file => 
      file.language === 'TypeScript' || file.language === 'JavaScript'
    )

    const testFrameworks: string[] = []
    
    // Detect test frameworks
    for (const testFile of testFiles) {
      try {
        const content = await fs.readFile(testFile.absolutePath, 'utf-8')
        if (content.includes('jest') || content.includes('describe(') || content.includes('it(')) {
          if (!testFrameworks.includes('Jest')) testFrameworks.push('Jest')
        }
        if (content.includes('@testing-library')) {
          if (!testFrameworks.includes('Testing Library')) testFrameworks.push('Testing Library')
        }
        if (content.includes('cypress') || content.includes('cy.')) {
          if (!testFrameworks.includes('Cypress')) testFrameworks.push('Cypress')
        }
      } catch (error) {
        // Could not read test file
      }
    }

    const coverageEstimate = sourceFiles.length > 0 
      ? Math.round((testFiles.length / sourceFiles.length) * 100)
      : 0

    return {
      hasTests: testFiles.length > 0,
      testFiles: testFiles.map(f => f.relativePath),
      testFrameworks,
      coverageEstimate: Math.min(coverageEstimate, 100)
    }
  }

  private async detectFrameworks(): Promise<string[]> {
    const frameworks: Set<string> = new Set()

    // Check package.json dependencies
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json')
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)
      
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      // Detect frameworks from dependencies
      if (allDeps.react) frameworks.add('React')
      if (allDeps.next) frameworks.add('Next.js')
      if (allDeps.express) frameworks.add('Express')
      if (allDeps['@prisma/client']) frameworks.add('Prisma')
      if (allDeps.tailwindcss) frameworks.add('Tailwind CSS')
      if (allDeps.typescript) frameworks.add('TypeScript')
      if (allDeps.jest) frameworks.add('Jest')
      if (allDeps['@testing-library/react']) frameworks.add('React Testing Library')
      if (allDeps.eslint) frameworks.add('ESLint')
      if (allDeps.prettier) frameworks.add('Prettier')
      if (allDeps['next-auth']) frameworks.add('NextAuth.js')
      
    } catch (error) {
      console.warn('Could not analyze package.json for frameworks:', error)
    }

    // Check for framework-specific files
    const frameworkFiles = [
      { file: 'next.config.js', framework: 'Next.js' },
      { file: 'next.config.mjs', framework: 'Next.js' },
      { file: 'tailwind.config.js', framework: 'Tailwind CSS' },
      { file: 'tsconfig.json', framework: 'TypeScript' },
      { file: 'prisma/schema.prisma', framework: 'Prisma' },
      { file: 'jest.config.js', framework: 'Jest' },
      { file: '.eslintrc.js', framework: 'ESLint' },
      { file: '.prettierrc', framework: 'Prettier' }
    ]

    for (const { file, framework } of frameworkFiles) {
      try {
        await fs.access(path.join(this.projectRoot, file))
        frameworks.add(framework)
      } catch (error) {
        // File doesn't exist
      }
    }

    return Array.from(frameworks)
  }

  private async scanDirectory(dir: string): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        // Check if path should be ignored
        const relativePath = path.relative(this.projectRoot, fullPath)
        if (this.ignoredPatterns.some(pattern => {
          // Convert glob patterns to simple checks
          if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))
            return regex.test(relativePath) || regex.test(entry.name)
          }
          return relativePath.includes(pattern) || entry.name.includes(pattern)
        })) {
          continue
        }
        
        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectory(fullPath)
          files.push(...subFiles)
        } else {
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dir}:`, error)
    }
    
    return files
  }
}