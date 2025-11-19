import { chainMiddlewares } from './middlewares/chain'
import { mobileBlockedMiddleware } from './middlewares/mobile-blocked'

export default chainMiddlewares([
  mobileBlockedMiddleware,
])

export const config = {
  matcher: [
    '/((?!mobile-blocked|_next/static|_next/image|favicon.ico).*)',
  ],
}
