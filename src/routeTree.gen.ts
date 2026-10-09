/* eslint-disable */
// Generated route tree for TradeStudy. TanStack Router may regenerate this file.
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as ResetPasswordRouteImport } from './routes/reset-password'
import { Route as AuthenticatedRouteImport } from './routes/_authenticated/route'
import { Route as DashboardRouteImport } from './routes/_authenticated/dashboard'
import { Route as ModulesRouteImport } from './routes/_authenticated/modules'
import { Route as LessonsRouteImport } from './routes/_authenticated/lessons'
import { Route as LessonDetailRouteImport } from './routes/_authenticated/lesson.$lessonId'
import { Route as NotebookRouteImport } from './routes/_authenticated/notebook'
import { Route as DoubtsRouteImport } from './routes/_authenticated/doubts'
import { Route as ReviewsRouteImport } from './routes/_authenticated/reviews'
import { Route as JournalRouteImport } from './routes/_authenticated/journal'
import { Route as SettingsRouteImport } from './routes/_authenticated/settings'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const AuthRoute = AuthRouteImport.update({ id: '/auth', path: '/auth', getParentRoute: () => rootRouteImport } as any)
const ResetPasswordRoute = ResetPasswordRouteImport.update({ id: '/reset-password', path: '/reset-password', getParentRoute: () => rootRouteImport } as any)
const AuthenticatedRoute = AuthenticatedRouteImport.update({ id: '/_authenticated', getParentRoute: () => rootRouteImport } as any)
const DashboardRoute = DashboardRouteImport.update({ id: '/dashboard', path: '/dashboard', getParentRoute: () => AuthenticatedRoute } as any)
const ModulesRoute = ModulesRouteImport.update({ id: '/modules', path: '/modules', getParentRoute: () => AuthenticatedRoute } as any)
const LessonsRoute = LessonsRouteImport.update({ id: '/lessons', path: '/lessons', getParentRoute: () => AuthenticatedRoute } as any)
const LessonDetailRoute = LessonDetailRouteImport.update({ id: '/lesson/$lessonId', path: '/lesson/$lessonId', getParentRoute: () => AuthenticatedRoute } as any)
const NotebookRoute = NotebookRouteImport.update({ id: '/notebook', path: '/notebook', getParentRoute: () => AuthenticatedRoute } as any)
const DoubtsRoute = DoubtsRouteImport.update({ id: '/doubts', path: '/doubts', getParentRoute: () => AuthenticatedRoute } as any)
const ReviewsRoute = ReviewsRouteImport.update({ id: '/reviews', path: '/reviews', getParentRoute: () => AuthenticatedRoute } as any)
const JournalRoute = JournalRouteImport.update({ id: '/journal', path: '/journal', getParentRoute: () => AuthenticatedRoute } as any)
const SettingsRoute = SettingsRouteImport.update({ id: '/settings', path: '/settings', getParentRoute: () => AuthenticatedRoute } as any)

const authenticatedChildren = { DashboardRoute, ModulesRoute, LessonsRoute, LessonDetailRoute, NotebookRoute, DoubtsRoute, ReviewsRoute, JournalRoute, SettingsRoute }
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(authenticatedChildren)
const rootRouteChildren = { IndexRoute, AuthRoute, ResetPasswordRoute, AuthenticatedRoute: AuthenticatedRouteWithChildren }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)
