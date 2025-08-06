import { NextResponse } from 'next/server'

// OpenAI-compatible models API
export async function GET() {
  return NextResponse.json({
    object: 'list',
    data: [
      {
        id: 'maverick-default',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'maverick',
        permission: [
          {
            id: 'modelperm-maverick',
            object: 'model_permission',
            created: Math.floor(Date.now() / 1000),
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: false,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        root: 'maverick-default',
        parent: null,
        description: 'Maverick AI-native business formation and development assistant with full business context'
      },
      {
        id: 'maverick-business',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'maverick',
        permission: [
          {
            id: 'modelperm-maverick-business',
            object: 'model_permission',
            created: Math.floor(Date.now() / 1000),
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: false,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        root: 'maverick-business',
        parent: null,
        description: 'Specialized in business strategy, formation, legal structures, and Square integrations'
      },
      {
        id: 'maverick-dev',
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'maverick',
        permission: [
          {
            id: 'modelperm-maverick-dev',
            object: 'model_permission',
            created: Math.floor(Date.now() / 1000),
            allow_create_engine: false,
            allow_sampling: true,
            allow_logprobs: false,
            allow_search_indices: false,
            allow_view: true,
            allow_fine_tuning: false,
            organization: '*',
            group: null,
            is_blocking: false
          }
        ],
        root: 'maverick-dev',
        parent: null,
        description: 'Technical implementation specialist with GitHub integration and development best practices'
      }
    ]
  })
}