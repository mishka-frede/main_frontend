import {
    Link,
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    clearAuth,
    getRole
} from "../auth/auth";

import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Chip,
    Container,
    Stack
} from "@mui/material";


const roleLabels = {
    resident: "Жилец",
    dispatcher: "Диспетчер",
    admin: "Администратор",
    executor: "Исполнитель"
};


function Navbar() {

    const navigate = useNavigate();
    const location = useLocation();

    const role = getRole();

    const navItems =
        role === "admin"
            ? [
                {
                    label: "Администрирование",
                    to: "/users"
                },
                {
                    label: "Профиль",
                    to: "/profile"
                }
            ]
            : role === "dispatcher"
                ? [
                    {
                        label: "Диспетчер",
                        to: "/dispatcher"
                    },
                    {
                        label: "Журнал",
                        to: "/action-log"
                    },
                    {
                        label: "Уведомления",
                        to: "/notifications"
                    },
                    {
                        label: "Профиль",
                        to: "/profile"
                    }
                ]
                : role === "executor"
                    ? [
                        {
                            label: "Мои заявки",
                            to: "/executor-tickets"
                        },
                        {
                            label: "Уведомления",
                            to: "/notifications"
                        },
                        {
                            label: "Профиль",
                            to: "/profile"
                        }
                    ]
                    : [
                        {
                            label: "Главная",
                            to: "/dashboard"
                        },
                        {
                            label: "Создать заявку",
                            to: "/create-ticket"
                        },
                        {
                            label: "Уведомления",
                            to: "/notifications"
                        },
                        {
                            label: "Профиль",
                            to: "/profile"
                        }
                    ];

    const handleLogout = () => {

        clearAuth();
        navigate("/", { replace: true });
    };

    return (

        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                backgroundColor: "rgba(255,255,255,0.92)",
                color: "text.primary",
                borderBottom: "1px solid",
                borderColor: "divider",
                backdropFilter: "blur(12px)"
            }}
        >
            <Container maxWidth="lg">
                <Toolbar
                    disableGutters
                    sx={{
                        minHeight: 72,
                        gap: 2,
                        flexWrap: "wrap",
                        py: { xs: 1.5, md: 0 }
                    }}
                >
                    <Box sx={{ flexGrow: 1 }}>
                        <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            sx={{ flexWrap: "wrap", rowGap: 1 }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ lineHeight: 1.1 }}
                            >
                                ТСЖ Сервис
                            </Typography>

                            {role && (
                                <Chip
                                    size="small"
                                    label={roleLabels[role] || role}
                                    color={
                                        ["admin", "dispatcher"].includes(role)
                                            ? "primary"
                                            : "default"
                                    }
                                    variant={
                                        ["admin", "dispatcher"].includes(role)
                                            ? "filled"
                                            : "outlined"
                                    }
                                />
                            )}
                        </Stack>

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Заявки жильцов и управление ТСЖ
                        </Typography>
                    </Box>

                    <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                            flexWrap: "wrap",
                            rowGap: 1,
                            justifyContent: { xs: "flex-start", md: "flex-end" }
                        }}
                    >
                        {navItems.map((item) => {

                            const active =
                                location.pathname === item.to;

                            return (
                                <Button
                                    key={item.to}
                                    component={Link}
                                    to={item.to}
                                    variant={active ? "contained" : "text"}
                                    color={active ? "primary" : "inherit"}
                                >
                                    {item.label}
                                </Button>
                            );
                        })}

                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={handleLogout}
                        >
                            Выйти
                        </Button>
                    </Stack>
                </Toolbar>
            </Container>
        </AppBar>
    );
}

export default Navbar;
