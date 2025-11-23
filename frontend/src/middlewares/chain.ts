import { NextMiddleware, NextResponse, NextRequest } from 'next/server'

type MiddlewareFactory = (request: NextRequest) => NextResponse | null

export function chainMiddlewares(
  middlewares: MiddlewareFactory[]
): NextMiddleware {
  return async (request: NextRequest) => {
    for (const middleware of middlewares) {
      const response = await middleware(request)
      
      if (response) {
        return response
      }
    }
    
    return NextResponse.next()
  }
}
