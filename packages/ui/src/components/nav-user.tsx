"use client"

import {
    CreditCard,
    MoreVertical,
    LogOut,
    Bell,
    User,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "./avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./sidebar"
import { useIsMobile } from "../hooks/use-mobile"

export interface NavUserProps {
    user: {
        name: string
        email: string
        avatar: string
    }
    onSignOut?: () => void | Promise<void>
    showSidebarLayout?: boolean
}

export function NavUser({
    user,
    onSignOut,
    showSidebarLayout = true,
}: NavUserProps) {
    const isMobile = useIsMobile()

    const handleSignOut = async () => {
        if (onSignOut) {
            await onSignOut();
        }
    };

    const getUserInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };

    const content = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {showSidebarLayout ? (
                    <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        <Avatar className="h-8 w-8 rounded-lg grayscale">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="rounded-lg">{getUserInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="text-muted-foreground truncate text-xs">
                                {user.email}
                            </span>
                        </div>
                        <MoreVertical className="ml-auto size-4" />
                    </SidebarMenuButton>
                ) : (
                    <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Avatar className="h-8 w-8 rounded-lg grayscale">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="rounded-lg">{getUserInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="text-muted-foreground truncate text-xs">
                                {user.email}
                            </span>
                        </div>
                        <MoreVertical className="ml-auto size-4" />
                    </button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="rounded-lg">{getUserInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="text-muted-foreground truncate text-xs">
                                {user.email}
                            </span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <User />
                        Account
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <CreditCard />
                        Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Bell />
                        Notifications
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    if (showSidebarLayout) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    {content}
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    return content
}
