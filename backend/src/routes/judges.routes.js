import {
    seeAssignedTeams,fillMarks,editMarks,viewPreviousMarks,viewPreviousRoundFeedback
} from '../controllers/judge.controller.js'
import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
const router = Router()

router.get('/seeAssignedTeams/:round',verifyJWT,seeAssignedTeams)
router.post('/fillMarks',verifyJWT,fillMarks)
router.put('/editMarks',verifyJWT,editMarks)
router.get('/viewPreviousMarks/:teamName',verifyJWT,viewPreviousMarks)
router.get('/viewPreviousRoundFeedback/:teamName/:round',verifyJWT,viewPreviousRoundFeedback)
export default router