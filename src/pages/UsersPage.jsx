import {
    useEffect,
    useState
} from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


function formatAddress(address) {

    return `${address.street}, д. ${address.house}, п. ${address.entrance || "-"}, кв. ${address.apartment}`;
}


function TabPanel({ children, value, index }) {

    if (value !== index) {
        return null;
    }

    return <Box sx={{ pt: 3 }}>{children}</Box>;
}


function UsersPage() {

    const [tab, setTab] = useState(0);

    const [users, setUsers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [pendingAddresses, setPendingAddresses] = useState([]);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [staffForm, setStaffForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "dispatcher"
    });

    const [creatingStaff, setCreatingStaff] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token")}`
    });

    const loadData = async () => {

        setError("");

        try {

            const [
                usersResponse,
                staffResponse,
                addressesResponse
            ] = await Promise.all([
                api.get("/users/", { headers: getAuthHeaders() }),
                api.get("/users/staff", { headers: getAuthHeaders() }),
                api.get("/addresses/pending", { headers: getAuthHeaders() })
            ]);

            setUsers(usersResponse.data);
            setStaff(staffResponse.data);
            setPendingAddresses(addressesResponse.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить данные.");
        }
    };

    const residentUsers = users.filter(
        (user) => user.role === "resident"
    );

    const updateRole = async (userId, role) => {

        setError("");
        setMessage("");

        try {

            await api.patch(
                `/users/${userId}/role`,
                { role },
                { headers: getAuthHeaders() }
            );

            setMessage("Роль пользователя обновлена.");
            loadData();

        } catch (err) {
            console.error(err);
            const detail = err.response?.data?.detail;
            setError(
                detail === "Use staff tab to create dispatcher or executor"
                    ? "Диспетчера и исполнителя создают на вкладке «Сотрудники»."
                    : "Не удалось обновить роль."
            );
        }
    };

    const demoteStaffToResident = async (userId) => {

        await updateRole(userId, "resident");
    };

    const verifyAddress = async (addressLinkId) => {

        setError("");
        setMessage("");

        try {

            await api.patch(
                `/addresses/${addressLinkId}/verify`,
                {},
                { headers: getAuthHeaders() }
            );

            setMessage("Адрес подтвержден.");
            loadData();

        } catch (err) {
            console.error(err);
            setError("Не удалось подтвердить адрес.");
        }
    };

    const handleStaffFormChange = (event) => {

        setStaffForm({
            ...staffForm,
            [event.target.name]: event.target.value
        });
    };

    const createStaff = async (event) => {

        event.preventDefault();
        setError("");
        setMessage("");
        setCreatingStaff(true);

        try {

            await api.post(
                "/users/staff",
                staffForm,
                { headers: getAuthHeaders() }
            );

            setMessage("Сотрудник создан.");
            setStaffForm({
                full_name: "",
                email: "",
                phone: "",
                password: "",
                role: "dispatcher"
            });
            loadData();
            setTab(2);

        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.detail === "Email already exists"
                    ? "Пользователь с таким email уже есть."
                    : "Не удалось создать сотрудника."
            );
        } finally {
            setCreatingStaff(false);
        }
    };

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Администрирование
                        </Typography>
                        <Typography color="text.secondary">
                            Жильцы, адреса и учётные записи сотрудников.
                        </Typography>
                    </Box>

                    {message && (
                        <Alert severity="success">{message}</Alert>
                    )}

                    {error && (
                        <Alert severity="error">{error}</Alert>
                    )}

                    <Tabs
                        value={tab}
                        onChange={(_, value) => setTab(value)}
                    >
                        <Tab label="Жильцы" />
                        <Tab label="Адреса" />
                        <Tab label="Сотрудники" />
                    </Tabs>

                    <TabPanel value={tab} index={0}>
                        <Stack spacing={2}>
                            {residentUsers.map((user) => (
                                <Card key={user.id}>
                                    <CardContent>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            alignItems={{ xs: "stretch", md: "center" }}
                                            justifyContent="space-between"
                                        >
                                            <Box>
                                                <Typography variant="h6">
                                                    {user.full_name}
                                                </Typography>
                                                <Typography color="text.secondary">
                                                    {user.email}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Телефон: {user.phone || "не указан"}
                                                </Typography>
                                            </Box>

                                            <Chip
                                                label={user.role_name || "Жилец"}
                                                color="default"
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            {residentUsers.length === 0 && (
                                <Typography color="text.secondary">
                                    Зарегистрированных жильцов пока нет.
                                </Typography>
                            )}
                        </Stack>
                    </TabPanel>

                    <TabPanel value={tab} index={1}>
                        <Card>
                            <CardContent>
                                <Stack spacing={2}>
                                    <Typography variant="h5">
                                        Адреса на подтверждение
                                    </Typography>

                                    {pendingAddresses.length === 0 && (
                                        <Typography color="text.secondary">
                                            Неподтвержденных адресов нет.
                                        </Typography>
                                    )}

                                    {pendingAddresses.map((address) => (
                                        <Card key={address.id}>
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: "column", md: "row" }}
                                                    spacing={2}
                                                    justifyContent="space-between"
                                                >
                                                    <Box>
                                                        <Typography variant="h6">
                                                            {formatAddress(address)}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Лицевой счет: {address.personal_account}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            {address.user?.full_name} ({address.user?.email})
                                                        </Typography>
                                                    </Box>
                                                    <Button
                                                        variant="contained"
                                                        onClick={() =>
                                                            verifyAddress(address.id)
                                                        }
                                                    >
                                                        Подтвердить
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </TabPanel>

                    <TabPanel value={tab} index={2}>
                        <Stack spacing={3}>
                            <Card>
                                <CardContent>
                                    <Stack
                                        component="form"
                                        spacing={2}
                                        onSubmit={createStaff}
                                    >
                                        <Typography variant="h5">
                                            Создать сотрудника
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Диспетчер и исполнитель не привязаны к адресам.
                                        </Typography>

                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: {
                                                    xs: "1fr",
                                                    sm: "1fr 1fr"
                                                },
                                                gap: 2
                                            }}
                                        >
                                            <TextField
                                                label="ФИО"
                                                name="full_name"
                                                value={staffForm.full_name}
                                                required
                                                fullWidth
                                                onChange={handleStaffFormChange}
                                            />
                                            <TextField
                                                label="Email"
                                                name="email"
                                                type="email"
                                                value={staffForm.email}
                                                required
                                                fullWidth
                                                onChange={handleStaffFormChange}
                                            />
                                            <TextField
                                                label="Телефон"
                                                name="phone"
                                                value={staffForm.phone}
                                                fullWidth
                                                onChange={handleStaffFormChange}
                                            />
                                            <TextField
                                                label="Пароль"
                                                name="password"
                                                type="password"
                                                value={staffForm.password}
                                                required
                                                fullWidth
                                                helperText="Минимум 5 символов"
                                                onChange={handleStaffFormChange}
                                            />
                                        </Box>

                                        <FormControl sx={{ maxWidth: 320 }}>
                                            <InputLabel>Роль</InputLabel>
                                            <Select
                                                label="Роль"
                                                name="role"
                                                value={staffForm.role}
                                                onChange={handleStaffFormChange}
                                            >
                                                <MenuItem value="dispatcher">
                                                    Диспетчер
                                                </MenuItem>
                                                <MenuItem value="executor">
                                                    Исполнитель
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        <Button
                                            type="submit"
                                            variant="contained"
                                            disabled={creatingStaff}
                                        >
                                            {creatingStaff
                                                ? "Создаём..."
                                                : "Создать сотрудника"}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>

                            <Stack spacing={2}>
                                <Typography variant="h6">
                                    Сотрудники системы
                                </Typography>

                                {staff.map((member) => (
                                    <Card key={member.id}>
                                        <CardContent>
                                            <Stack
                                                direction={{ xs: "column", md: "row" }}
                                                spacing={2}
                                                justifyContent="space-between"
                                            >
                                                <Box>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="h6">
                                                            {member.full_name}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={member.role_name}
                                                            color="primary"
                                                        />
                                                    </Stack>
                                                    <Typography color="text.secondary">
                                                        {member.email}
                                                    </Typography>
                                                </Box>
                                                <Button
                                                    variant="outlined"
                                                    onClick={() =>
                                                        demoteStaffToResident(member.id)
                                                    }
                                                >
                                                    Сделать жильцом
                                                </Button>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))}

                                {staff.length === 0 && (
                                    <Typography color="text.secondary">
                                        Сотрудников пока нет.
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>
                    </TabPanel>
                </Stack>
            </Container>
        </Box>
    );
}

export default UsersPage;
