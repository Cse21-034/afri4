import CorridorPage from "@/components/CorridorPage";

export default function GaboroneFrancistown() {
  return (
    <CorridorPage
      testId="corridor-gaborone-francistown"
      title="Gaborone – Francistown Freight Corridor"
      originCity="Gaborone"
      originCountry="Botswana"
      destinationCity="Francistown"
      destinationCountry="Botswana"
      crossBorder={false}
      description="Botswana's key domestic freight route along the A1, linking the capital with the country's second-largest city. Post a load or find return freight between Botswana's two biggest urban centres."
      cargoNote="Commonly moved cargo on this route includes general trade goods, retail supplies, construction materials, and agricultural products moving between southern and northern Botswana."
    />
  );
}
