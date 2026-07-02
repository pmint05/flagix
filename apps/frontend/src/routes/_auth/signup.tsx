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
import { signUp } from "@/lib/auth-client";
import {
	EnvelopeSimpleIcon,
	LockKeyIcon,
	UserIcon,
	UserPlusIcon,
	EyeIcon,
	EyeSlashIcon,
} from "@phosphor-icons/react";

const signupSchema = z
	.object({
		name: z.string().min(1, "Name is required"),
		email: z.email("Invalid email address").min(1, "Email is required"),
		password: z.string().min(8, "Password must be at least 8 characters"),
		// .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		// .regex(/[0-9]/, "Password must contain at least one number"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type SignupForm = z.infer<typeof signupSchema>;

export const Route = createFileRoute("/_auth/signup")({
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [isConfirmVisible, setIsConfirmVisible] = useState(false);

	const toggleVisibility = () => setIsVisible(!isVisible);
	const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignupForm>({
		resolver: zodResolver(signupSchema),
	});

	const onSubmit = async (data: SignupForm) => {
		setIsLoading(true);
		try {
			const result = await signUp.email({
				name: data.name,
				email: data.email,
				password: data.password,
			});

			if (result.error) {
				toast.danger(result.error.message ?? "Sign up failed");
				return;
			}

			toast.success("Account created successfully", {
				onClose: () => navigate({ to: "/" }),
			});
		} catch (error) {
			toast.danger("An unexpected error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="p-6 rounded-[1.5rem]">
			<Card.Header>
				<Card.Title>Create Account</Card.Title>
				<Card.Description>
					Join Flagix to start managing feature flags
				</Card.Description>
			</Card.Header>
			<Form
				onSubmit={handleSubmit(onSubmit)}
				className="w-full"
				validationBehavior="aria">
				<Fieldset>
					<Card.Content>
						<Fieldset.Group className="space-y-5">
							<TextField className="w-full" isInvalid={!!errors.name}>
								<Label>Full Name</Label>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<UserIcon weight="bold" size={18} />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("name")}
										placeholder="John Doe"
										className="w-full"
									/>
								</InputGroup>
								<FieldError>{errors.name?.message}</FieldError>
							</TextField>

							<TextField className="w-full" isInvalid={!!errors.email}>
								<Label>Email address</Label>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<EnvelopeSimpleIcon weight="bold" size={18} />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("email")}
										type="email"
										placeholder="you@company.com"
										className="w-full"
									/>
								</InputGroup>
								<FieldError>{errors.email?.message}</FieldError>
							</TextField>

							<TextField className="w-full" isInvalid={!!errors.password}>
								<Label>Password</Label>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<LockKeyIcon weight="bold" size={18} />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("password")}
										type={isVisible ? "text" : "password"}
										placeholder="Create a strong password"
										className="w-full"
									/>
									<InputGroup.Suffix>
										<Button
											excludeFromTabOrder
											isIconOnly
											size="sm"
											variant="ghost"
											onClick={toggleVisibility}
											aria-label="Toggle password visibility">
											{isVisible ? <EyeSlashIcon /> : <EyeIcon />}
										</Button>
									</InputGroup.Suffix>
								</InputGroup>
								<FieldError>{errors.password?.message}</FieldError>
							</TextField>

							<TextField
								className="w-full"
								isInvalid={!!errors.confirmPassword}>
								<Label>Confirm Password</Label>
								<InputGroup variant="secondary">
									<InputGroup.Prefix>
										<LockKeyIcon weight="bold" size={18} />
									</InputGroup.Prefix>
									<InputGroup.Input
										{...register("confirmPassword")}
										type={isConfirmVisible ? "text" : "password"}
										placeholder="Confirm your password"
										className="w-full"
									/>
									<InputGroup.Suffix>
										<Button
											excludeFromTabOrder
											isIconOnly
											size="sm"
											variant="ghost"
											onClick={toggleConfirmVisibility}
											aria-label="Toggle confirm password visibility">
											{isConfirmVisible ? <EyeSlashIcon /> : <EyeIcon />}
										</Button>
									</InputGroup.Suffix>
								</InputGroup>
								<FieldError>{errors.confirmPassword?.message}</FieldError>
							</TextField>
						</Fieldset.Group>

						<Fieldset.Actions className="mt-6 flex flex-col items-center">
							<Button
								type="submit"
								variant="primary"
								className="w-full font-medium"
								isDisabled={isLoading}>
								{!isLoading && <UserPlusIcon weight="bold" className="mr-2" />}
								{isLoading ? (
									<Spinner size="sm" color="current" />
								) : (
									"Create account"
								)}
							</Button>

							<div className="mt-4 text-center text-sm">
								Already have an account?{" "}
								<Link
									to="/login"
									className="font-semibold text-primary transition-colors hover:text-primary-500 hover:underline">
									Sign in instead
								</Link>
							</div>
						</Fieldset.Actions>
					</Card.Content>
				</Fieldset>
			</Form>
		</Card>
	);
}
