import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Container,
    Stack,
    TextField,
    Typography
} from "@mui/material";

import api from "../api/api";
import Navbar from "../components/Navbar";


const profileFields = [
    {
        key: "full_name",
        label: "ФИО",
        type: "text",
        helperText: "Как вас будут видеть в системе"
    },
    {
        key: "email",
        label: "Email",
        type: "email",
        helperText: "Используется для входа"
    },
    {
        key: "phone",
        label: "Телефон",
        type: "tel",
        helperText: "Контактный номер для связи"
    },
    {
        key: "password",
        label: "Пароль",
        type: "password",
        helperText: "Оставьте пустым, если не хотите менять пароль",
        preview: "Не отображается"
    }
];

const emptyAddress = {
    street: "",
    house: "",
    entrance: "",
    apartment: "",
    personal_account: ""
};


function formatAddress(address) {

    return `${address.street}, д. ${address.house}, п. ${address.entrance || "-"}, кв. ${address.apartment}`;
}


function ProfilePage() {

    const [profile, setProfile] =
        useState({
            full_name: "",
            email: "",
            phone: "",
            password: ""
        });

    const [addresses, setAddresses] =
        useState([]);

    const [addressForm, setAddressForm] =
        useState(emptyAddress);

    const [editingAddressId, setEditingAddressId] =
        useState(null);

    const [activeFieldKey, setActiveFieldKey] =
        useState("full_name");

    const [draftValue, setDraftValue] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [hasAddresses, setHasAddresses] =
        useState(true);

    const activeField = useMemo(
        () => profileFields.find((field) =>
            field.key === activeFieldKey
        ),
        [activeFieldKey]
    );

    const getAuthHeaders = useCallback(() => {

        const token =
            localStorage.getItem("token");

        return {
            Authorization: `Bearer ${token}`
        };
    }, []);

    const loadProfile = useCallback(async () => {

        try {

            const res =
                await api.get(
                    "/users/me",
                    {
                        headers: getAuthHeaders()
                    }
                );

            const nextProfile = {
                full_name: res.data.full_name || "",
                email: res.data.email || "",
                phone: res.data.phone || "",
                password: ""
            };

            setProfile(nextProfile);
            setDraftValue(nextProfile.full_name || "");

            setHasAddresses(
                res.data.has_addresses !== false
            );

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить профиль.");
        }
    }, [getAuthHeaders]);

    const loadAddresses = useCallback(async () => {

        try {

            const res =
                await api.get(
                    "/addresses/my",
                    {
                        headers: getAuthHeaders()
                    }
                );

            setAddresses(res.data);

        } catch (err) {
            console.error(err);
            setError("Не удалось загрузить адреса.");
        }
    }, [getAuthHeaders]);

    useEffect(() => {

        const timeoutId = window.setTimeout(() => {
            loadProfile();
        }, 0);

        return () => window.clearTimeout(timeoutId);

    }, [loadProfile]);

    useEffect(() => {

        if (hasAddresses) {

            const timeoutId = window.setTimeout(() => {
                loadAddresses();
            }, 0);

            return () => window.clearTimeout(timeoutId);
        }

        return undefined;

    }, [hasAddresses, loadAddresses]);

    const selectField = (field) => {

        setMessage("");
        setError("");
        setActiveFieldKey(field.key);
        setDraftValue(profile[field.key] || "");
    };

    const cancelEdit = () => {

        if (activeField) {
            setDraftValue(profile[activeField.key] || "");
        }
    };

    const saveActiveField = async () => {

        if (!activeField) {
            return;
        }

        setMessage("");
        setError("");
        setLoading(true);

        const nextProfile = {
            ...profile,
            [activeField.key]: draftValue
        };

        try {

            await api.put(
                "/users/me",
                nextProfile,
                {
                    headers: getAuthHeaders()
                }
            );

            setProfile({
                ...nextProfile,
                password: ""
            });

            setDraftValue(
                activeField.key === "password"
                    ? ""
                    : draftValue
            );

            setMessage(`Поле "${activeField.label}" обновлено.`);

        } catch (err) {
            console.error(err);
            setError("Не удалось сохранить изменения.");
        } finally {
            setLoading(false);
        }
    };

    const getPreviewValue = (field) => {

        if (field.preview) {
            return field.preview;
        }

        return profile[field.key] || "Не заполнено";
    };

    const handleAddressChange = (event) => {

        setAddressForm({
            ...addressForm,
            [event.target.name]: event.target.value
        });
    };

    const startEditAddress = (address) => {

        setEditingAddressId(address.id);
        setAddressForm({
            street: address.street || "",
            house: address.house || "",
            entrance: address.entrance || "",
            apartment: address.apartment || "",
            personal_account: address.personal_account || ""
        });
    };

    const resetAddressForm = () => {

        setEditingAddressId(null);
        setAddressForm(emptyAddress);
    };

    const saveAddress = async () => {

        setMessage("");
        setError("");

        try {

            if (editingAddressId) {

                await api.put(
                    `/addresses/my/${editingAddressId}`,
                    addressForm,
                    {
                        headers: getAuthHeaders()
                    }
                );

                setMessage("Адрес обновлен и ожидает повторного подтверждения.");

            } else {

                await api.post(
                    "/addresses/my",
                    addressForm,
                    {
                        headers: getAuthHeaders()
                    }
                );

                setMessage("Адрес добавлен и ожидает подтверждения.");
            }

            resetAddressForm();
            loadAddresses();

        } catch (err) {
            console.error(err);
            setError("Не удалось сохранить адрес.");
        }
    };

    const setPrimaryAddress = async (addressId) => {

        try {

            await api.patch(
                `/addresses/my/${addressId}/primary`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            setMessage("Основной адрес обновлен.");
            loadAddresses();

        } catch (err) {
            console.error(err);
            setError("Не удалось выбрать основной адрес.");
        }
    };

    const deleteAddress = async (addressId) => {

        try {

            await api.delete(
                `/addresses/my/${addressId}`,
                {
                    headers: getAuthHeaders()
                }
            );

            setMessage("Адрес удален.");
            loadAddresses();

        } catch (err) {
            console.error(err);
            setError("Нельзя удалить адрес с активными заявками.");
        }
    };

    return (

        <Box sx={{ minHeight: "100vh" }}>
            <Navbar />

            <Container
                maxWidth="lg"
                sx={{ py: 4 }}
            >
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Личный кабинет
                        </Typography>
                        <Typography color="text.secondary">
                            {hasAddresses
                                ? "Управляйте контактами и адресами недвижимости."
                                : "Управляйте контактными данными учётной записи."}
                        </Typography>
                    </Box>

                    {message && (
                        <Alert severity="success">
                            {message}
                        </Alert>
                    )}

                    {error && (
                        <Alert severity="error">
                            {error}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1.3fr 0.9fr"
                            },
                            gap: 3,
                            alignItems: "start"
                        }}
                    >
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
                            {profileFields.map((field) => {

                                const isActive =
                                    field.key === activeFieldKey;

                                return (
                                    <Card
                                        key={field.key}
                                        sx={{
                                            borderColor: isActive
                                                ? "primary.main"
                                                : "divider"
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() =>
                                                selectField(field)
                                            }
                                        >
                                            <CardContent>
                                                <Stack spacing={1}>
                                                    <Stack
                                                        direction="row"
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                        spacing={1}
                                                    >
                                                        <Typography
                                                            variant="subtitle2"
                                                            color="text.secondary"
                                                        >
                                                            {field.label}
                                                        </Typography>

                                                        {isActive && (
                                                            <Chip
                                                                size="small"
                                                                color="primary"
                                                                label="Активно"
                                                            />
                                                        )}
                                                    </Stack>

                                                    <Typography variant="h6">
                                                        {getPreviewValue(field)}
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {field.helperText}
                                                    </Typography>
                                                </Stack>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                );
                            })}
                        </Box>

                        <Card>
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="h5" gutterBottom>
                                            Редактирование
                                        </Typography>
                                        <Typography color="text.secondary">
                                            Сейчас выбрано поле: {activeField?.label}
                                        </Typography>
                                    </Box>

                                    <TextField
                                        fullWidth
                                        label={activeField?.label}
                                        type={activeField?.type || "text"}
                                        value={draftValue}
                                        helperText={activeField?.helperText}
                                        onChange={(event) =>
                                            setDraftValue(event.target.value)
                                        }
                                    />

                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1}
                                    >
                                        <Button
                                            variant="contained"
                                            disabled={loading}
                                            onClick={saveActiveField}
                                        >
                                            {loading ? "Сохраняем..." : "Сохранить"}
                                        </Button>

                                        <Button
                                            variant="outlined"
                                            disabled={loading}
                                            onClick={cancelEdit}
                                        >
                                            Отмена
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Box>

                    {hasAddresses && (
                    <Card>
                        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                            <Stack spacing={3}>
                                <Box>
                                    <Typography variant="h5" gutterBottom>
                                        Мои адреса
                                    </Typography>
                                    <Typography color="text.secondary">
                                        Заявки можно создавать только по подтвержденным адресам.
                                    </Typography>
                                </Box>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(4, 1fr)"
                                        },
                                        gap: 2
                                    }}
                                >
                                    <TextField
                                        label="Улица"
                                        name="street"
                                        value={addressForm.street}
                                        onChange={handleAddressChange}
                                    />
                                    <TextField
                                        label="Дом"
                                        name="house"
                                        value={addressForm.house}
                                        onChange={handleAddressChange}
                                    />
                                    <TextField
                                        label="Подъезд"
                                        name="entrance"
                                        value={addressForm.entrance}
                                        onChange={handleAddressChange}
                                    />
                                    <TextField
                                        label="Квартира"
                                        name="apartment"
                                        value={addressForm.apartment}
                                        onChange={handleAddressChange}
                                    />
                                    <TextField
                                        label="Лицевой счет"
                                        name="personal_account"
                                        value={addressForm.personal_account}
                                        onChange={handleAddressChange}
                                    />
                                </Box>

                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={1}
                                >
                                    <Button
                                        variant="contained"
                                        onClick={saveAddress}
                                    >
                                        {editingAddressId ? "Сохранить адрес" : "Добавить адрес"}
                                    </Button>

                                    {editingAddressId && (
                                        <Button
                                            variant="outlined"
                                            onClick={resetAddressForm}
                                        >
                                            Отмена
                                        </Button>
                                    )}
                                </Stack>

                                <Stack spacing={2}>
                                    {addresses.map((address) => (
                                        <Card key={address.id}>
                                            <CardContent>
                                                <Stack
                                                    direction={{ xs: "column", md: "row" }}
                                                    spacing={2}
                                                    justifyContent="space-between"
                                                >
                                                    <Stack spacing={1}>
                                                        <Typography variant="h6">
                                                            {formatAddress(address)}
                                                        </Typography>
                                                        <Typography color="text.secondary">
                                                            Лицевой счет: {address.personal_account}
                                                        </Typography>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            sx={{ flexWrap: "wrap", rowGap: 1 }}
                                                        >
                                                            <Chip
                                                                label={address.is_verified ? "Подтвержден" : "Не подтвержден"}
                                                                color={address.is_verified ? "success" : "warning"}
                                                            />
                                                            {address.is_primary && (
                                                                <Chip
                                                                    label="Основной"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            )}
                                                        </Stack>
                                                    </Stack>

                                                    <Stack
                                                        direction={{ xs: "column", sm: "row" }}
                                                        spacing={1}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            onClick={() =>
                                                                startEditAddress(address)
                                                            }
                                                        >
                                                            Изменить
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            disabled={address.is_primary}
                                                            onClick={() =>
                                                                setPrimaryAddress(address.id)
                                                            }
                                                        >
                                                            Основной
                                                        </Button>
                                                        <Button
                                                            color="error"
                                                            variant="outlined"
                                                            onClick={() =>
                                                                deleteAddress(address.id)
                                                            }
                                                        >
                                                            Удалить
                                                        </Button>
                                                    </Stack>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                    )}
                </Stack>
            </Container>
        </Box>
    );
}

export default ProfilePage;
