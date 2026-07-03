import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Button,
	Form,
	FieldError,
	InputGroup,
	Label,
	Spinner,
	TextField,
	Fieldset,
	Card,
	toast,
} from "@heroui/react";
import { signIn } from "@/lib/auth-client";
import {
	EnvelopeSimpleIcon,
	EyeIcon,
	EyeSlashIcon,
	LockKeyIcon,
	SignInIcon,
} from "@phosphor-icons/react";

const loginSchema = z.object({
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/_auth/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);

	const toggleVisibility = () => setIsVisible(!isVisible);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginForm>({
		resolver: zodResolver(loginSchema),
		reValidateMode: "onSubmit",
		shouldFocusError: true,
	});

	const onSubmit = async (data: LoginForm) => {
		setIsLoading(true);
		try {
			const result = await signIn.email({
				email: data.email,
				password: data.password,
			});

			if (result.error) {
				toast.danger(result.error.message ?? "Login failed");
				return;
			}

			toast.success("Welcome back!");
			setTimeout(() => navigate({ to: "/" }), 0);
		} catch (error) {
			toast.danger("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="p-6 rounded-[1.5rem]">
			<Card.Header>
				<Card.Title className="text-lg font-semibold text-foreground">
					Sign in to your account
				</Card.Title>
				<Card.Description className="text-sm">
					Enter your details to proceed
				</Card.Description>
			</Card.Header>
			<Form
				onSubmit={handleSubmit(onSubmit)}
				className="w-full"
				validationBehavior="aria">
				<Fieldset>
					<Card.Content>
						<Fieldset.Group className="space-y-5">
							<TextField className="w-full" isInvalid={!!errors.email}>
								<Label className="font-medium">Email address</Label>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<EnvelopeSimpleIcon className="size-5" weight="bold" />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("email")}
										type="email"
										placeholder="name@company.com"
										className="w-full"
									/>
								</InputGroup>
								<FieldError>{errors.email?.message}</FieldError>
							</TextField>
							<TextField className="w-full" isInvalid={!!errors.password}>
								<div className="flex items-center justify-between">
									<Label className="font-medium">Password</Label>
									<Link
										to="/"
										tabIndex={-1}
										className="font-semibold text-sm text-muted transition-colors hover:text-accent hover:underline">
										Forgot password?
									</Link>
								</div>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<LockKeyIcon className="size-5" weight="bold" />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("password")}
										type={isVisible ? "text" : "password"}
										placeholder="••••••••"
										className="w-full"
									/>
									<InputGroup.Suffix>
										<Button
											excludeFromTabOrder
											isIconOnly
											size="sm"
											variant="ghost"
											onClick={toggleVisibility}
											aria-label="Toggle password visibility"
											className="">
											{isVisible ? <EyeSlashIcon /> : <EyeIcon />}
										</Button>
									</InputGroup.Suffix>
								</InputGroup>
								<FieldError>{errors.password?.message}</FieldError>
							</TextField>
						</Fieldset.Group>
						<Fieldset.Actions className="mt-6 flex flex-col items-center">
							<Button
								type="submit"
								variant="primary"
								className="w-full font-medium"
								isDisabled={isLoading}
								isPending={isLoading}>
								{!isLoading && <SignInIcon weight="bold" className="mr-2" />}
								{isLoading ? <Spinner size="sm" color="current" /> : "Sign in"}
							</Button>
							<div className="mt-4 text-center text-sm">
								Don't have an account?{" "}
								<Link
									to="/signup"
									className="font-semibold text-primary transition-colors hover:text-primary-500 hover:underline">
									Create one now
								</Link>
							</div>
						</Fieldset.Actions>
					</Card.Content>
				</Fieldset>
			</Form>
		</Card>
	);
}
