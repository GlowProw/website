import {useUserApi} from "@/assets/sripts/api/user_service";
import {useAssemblyApi} from "@/assets/sripts/api/assembly_service";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useCaptchaApi} from "@/assets/sripts/api/captcha_service";
import {useCalendarApi} from "@/assets/sripts/api/calendar_service";
import {useCommentApi} from "@/assets/sripts/api/comment_service";

export * from './user_service'
export * from './assembly_service'
export * from './map_service'
export * from './captcha_service'

export class Apis {
    static commentApi = useCommentApi
    static userApi = useUserApi
    static assemblyApi = useAssemblyApi
    static mapApi = useMapApi
    static captchaApi = useCaptchaApi
    static calendarApi = useCalendarApi
}
