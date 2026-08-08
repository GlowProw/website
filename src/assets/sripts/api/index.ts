import {useUserApi} from "@/assets/sripts/api/user_service";
import {useAssemblyApi} from "@/assets/sripts/api/assembly_service";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useCaptchaApi} from "@/assets/sripts/api/captcha_service";
import {useCalendarApi} from "@/assets/sripts/api/calendar_service";
import {useCommentApi} from "@/assets/sripts/api/comment_service";
import {useSmugglersApi} from "@/assets/sripts/api/smugglers_service";
import {usePrivilegeApi} from "@/assets/sripts/api/privilege_service";
import {useTrashApi} from "@/assets/sripts/api/trash_service";
import {useTeamupApi} from "@/assets/sripts/api/teamup_service";
import {useBlogApi} from "@/assets/sripts/api/blog_service";

export * from './user_service'
export * from './assembly_service'
export * from './map_service'
export * from './captcha_service'
export * from './calendar_service'
export * from './comment_service'
export * from './smugglers_service'
export * from './privilege_service'
export * from './trash_service'
export * from './teamup_service'
export * from './blog_service'
export * from './api-util'

export class Apis {
    static commentApi = useCommentApi
    static userApi = useUserApi
    static assemblyApi = useAssemblyApi
    static mapApi = useMapApi
    static captchaApi = useCaptchaApi
    static calendarApi = useCalendarApi
    static smugglersApi = useSmugglersApi
    static privilegeApi = usePrivilegeApi
    static trashApi = useTrashApi
    static teamupApi = useTeamupApi
    static blogApi = useBlogApi
}
