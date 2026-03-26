export default function CompanyLogo({
  size = 54,
}: {
  size?: number
}) {
  return (
    <img
      src="/logo-company.png"
      alt="Company Logo"
      className="logo-image"
      style={{
        width: size,
        height: size,
      }}
    />
  )
}