import {useUserApi} from "@/assets/sripts/api/user_service";
import {useAssemblyApi} from "@/assets/sripts/api/assembly_service";
import {useMapApi} from "@/assets/sripts/api/map_service";
import {useCaptchaApi} from "@/assets/sripts/api/captcha_service";
import {useCalendarApi} from "@/assets/sripts/api/calendar_service";
import {useCommentApi} from "@/assets/sripts/api/comment_service";
import {useSmugglersApi} from "@/assets/sripts/api/smugglers_service";
import {usePrivilegeApi} from "@/assets/sripts/api/privilege_service";
import {useTeamupApi} from "@/assets/sripts/api/teamup_service";

export class Apis {
    static commentApi = useCommentApi
    static userApi = useUserApi
    static assemblyApi = useAssemblyApi
    static mapApi = useMapApi
    static captchaApi = useCaptchaApi
    static calendarApi = useCalendarApi
    static smugglersApi = useSmugglersApi
    static privilegeApi = usePrivilegeApi
    static teamupApi = useTeamupApi
}
