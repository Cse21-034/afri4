import CorridorPage from "@/components/CorridorPage";

export default function GaboroneJohannesburg() {
  return (
    <CorridorPage
      testId="corridor-gaborone-johannesburg"
      title="Gaborone – Johannesburg Freight Corridor"
      originCity="Gaborone"
      originCountry="Botswana"
      destinationCity="Johannesburg"
      destinationCountry="South Africa"
      crossBorder={true}
      description="One of the busiest cross-border freight routes in the region, connecting Botswana's capital with South Africa's largest commercial hub. Post a load or find return freight on this corridor."
      cargoNote="Commonly moved cargo on this route includes general trade goods, containers, retail and manufacturing supplies, and bulk freight moving between the two countries."
    />
  );
}
