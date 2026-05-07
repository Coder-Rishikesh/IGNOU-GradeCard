# Moonlit Minutes - IGNOU Grade Card Calculator

A harmless time-pass project that fetches an IGNOU grade card and presents a clean, semester-wise marks view with a quick percentage summary.

## What it does
- Fetches grade card data from the official IGNOU grade card page.
- Groups courses by semester/year/term when possible.
- Shows assignment, practical (labs + term-end practical), theory, total, and percentage.

## Formula used
The UI computes course percentage using a weighted split between assignment and term-end (TEE) marks.

$$
\text{Course Percentage} = 0.30 \times A + 0.70 \times T
$$

Where:
- $A$ is Assignment marks.
- $T$ is Term-End (TEE) marks. If theory is available, it is used; otherwise, practical TEE is used.

If only $A$ or only $T$ is available, the percentage is set to that value.

Semester and overall percentages are simple averages of the available course percentages:

$$
\text{Semester Percentage} = \frac{1}{n} \sum_{i=1}^{n} P_i
$$

$$
\text{Overall Percentage} = \frac{1}{m} \sum_{i=1}^{m} P_i
$$

## Run locally
1. Install dependencies:
   - `npm install`
2. Start the server:
   - `npm run dev`
3. Open `http://localhost:3000`

## Notes
- The grade card is fetched live from IGNOU servers, so results depend on their availability.
- Program type is auto-detected if you leave it on Auto.
