<script>
	import { onMount, onDestroy } from 'svelte';
	import { Modal } from 'bootstrap';
	import { supabase } from '$lib/supabaseClient.js';

	let { show = false, onAuthenticated = null } = $props();

	let modalEl = $state(null);
	let modalInstance = $state(null);

	// Modal state
	let step = $state('email'); // 'email' or 'verify'
	let email = $state('');
	let code = $state('');
	let message = $state('');
	let error = $state('');
	let sending = $state(false);
	let verifying = $state(false);

	// Resend cooldown
	let resendCooldown = $state(0);
	let cooldownInterval = $state(null);

	onMount(() => {
		modalInstance = new Modal(modalEl, {
			backdrop: 'static',
			keyboard: false
		});

		return () => {
			if (cooldownInterval) clearInterval(cooldownInterval);
		};
	});

	onDestroy(() => {
		modalInstance.hide();
	});

	$effect(() => {
		if (show) {
			modalInstance.show();
		} else if (!show) {
			modalInstance.hide();
            resetModal();
		}
	});

	function startCooldown() {
		resendCooldown = 60;
		cooldownInterval = setInterval(() => {
			resendCooldown--;
			if (resendCooldown <= 0) {
				clearInterval(cooldownInterval);
				cooldownInterval = null;
			}
		}, 1000);
	}

	async function sendOTP(isResend = false) {
		sending = true;
		error = '';
		message = '';

		try {
			const { data, error: otpError } = await supabase.auth.signInWithOtp({
				email: email.trim(),
				options: {
					shouldCreateUser: true
				}
			});

			if (otpError) throw otpError;

			message = isResend ? 'Code resent!' : 'Check your email for the verification code';
			step = 'verify';
			startCooldown();
			
			// Clear message after a few seconds
			setTimeout(() => message = '', 3000);
		} catch (err) {
			error = err.message || 'Error sending code';
		} finally {
			sending = false;
		}
	}

	async function verifyOTP() {
		verifying = true;
		error = '';
		message = '';

		try {
			const { data, error: verifyError } = await supabase.auth.verifyOtp({
				email: email.trim(),
				token: code.trim(),
				type: 'email'
			});

			if (verifyError) throw verifyError;

			message = 'Authentication successful!';
			setTimeout(() => {
				show = false;
				if (onAuthenticated) {
					onAuthenticated();
				}
			}, 500);
		} catch (err) {
			error = err.message || 'Invalid code';
		} finally {
			verifying = false;
		}
	}

	function resetModal() {
		step = 'email';
		email = '';
		code = '';
		message = '';
		error = '';
		if (cooldownInterval) {
			clearInterval(cooldownInterval);
			cooldownInterval = null;
		}
		resendCooldown = 0;
	}

	function handleResend() {
		if (resendCooldown > 0) return;
		sendOTP(true);
	}
</script>

<div
	class="modal fade"
	bind:this={modalEl}
	tabindex="-1"
	aria-hidden="true"
	data-bs-backdrop="static"
	data-bs-keyboard="false"
>
	<div class="modal-dialog modal-dialog-centered">
		<div class="modal-content bg-dark text-light border-light shadow-lg">
			<div class="modal-header border-secondary">
				<h5 class="modal-title">
					{step === 'email' ? 'Sign In' : 'Enter Verification Code'}
				</h5>
				{#if step === 'verify'}
					<button
						type="button"
						class="btn-close btn-close-white"
						onclick={() => step = 'email'}
						aria-label="Back"
					></button>
				{/if}
			</div>
			<div class="modal-body">
				{#if step === 'email'}
					<!-- Email Entry -->
					<p class="text-secondary mb-3">
						Enter your email address to receive a verification code.
					</p>

					<form onsubmit={(e) => { e.preventDefault(); sendOTP(); }}>
						<div class="mb-3">
							<input
								type="email"
								bind:value={email}
								class="form-control bg-dark text-light border-secondary"
								placeholder="your@email.com"
								required
								autocomplete="email"
							/>
						</div>

						{#if message}
							<div class="alert alert-success py-2">{message}</div>
						{/if}

						{#if error}
							<div class="alert alert-danger py-2">{error}</div>
						{/if}

						<button type="submit" class="btn btn-primary w-100" disabled={sending}>
							{#if sending}
								<span class="spinner-border spinner-border-sm me-2"></span>
								Sending...
							{:else}
								Send Code
							{/if}
						</button>
					</form>
				{:else}
					<!-- Code Verification -->
					<p class="text-secondary mb-3">
						Enter the 6-digit code sent to <strong>{email}</strong>
					</p>

					<form onsubmit={(e) => { e.preventDefault(); verifyOTP(); }}>
						<div class="mb-3">
							<input
								type="text"
								bind:value={code}
								class="form-control bg-dark text-light border-secondary text-center fs-4 letter-spacing-wide"
								placeholder="000000"
								maxlength="6"
								required
								autocomplete="one-time-code"
								inputmode="numeric"
							/>
						</div>

						{#if message}
							<div class="alert alert-success py-2">{message}</div>
						{/if}

						{#if error}
							<div class="alert alert-danger py-2">{error}</div>
						{/if}

						<button type="submit" class="btn btn-primary w-100 mb-2" disabled={verifying}>
							{#if verifying}
								<span class="spinner-border spinner-border-sm me-2"></span>
								Verifying...
							{:else}
								Verify Code
							{/if}
						</button>

						<button
							type="button"
							class="btn btn-outline-secondary w-100"
							onclick={handleResend}
							disabled={resendCooldown > 0}
						>
							{#if resendCooldown > 0}
								Resend Code ({resendCooldown}s)
							{:else}
								Resend Code
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.letter-spacing-wide {
		letter-spacing: 0.5rem;
	}
</style>
